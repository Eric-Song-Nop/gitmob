# tree-sitter Expo Native Module 详细设计

## 架构概述

### 核心设计原则

**iOS 和 Android 共享同一套 C++ 逻辑**，平台特定代码（Swift/Kotlin）仅做桥接，不直接接触 tree-sitter C API。

```
JS (TypeScript)
    │ requireNativeModule('TreeSitter')
    ↓
┌─────────────────────────┬────────────────────────────┐
│ iOS                     │ Android                    │
│ TreeSitterModule.swift  │ TreeSitterModule.kt        │
│ (Expo Module DSL)       │ (Expo Module DSL)          │
│         │               │         │                  │
│ TreeSitterBridge.mm     │ TreeSitterJNI.cpp          │
│ (Obj-C++)               │ (JNI)                      │
└────────┬────────────────┴─────────┬──────────────────┘
         │                          │
         └──────────┬───────────────┘
                    ↓
        ┌───────────────────────┐
        │ 共享 C++ 核心层        │
        │ (cpp/ 目录)            │
        │                       │
        │ TreeSitterCore        │
        │ ParserPool            │
        │ QueryEngine           │
        │ ResultSerializer      │
        │ LanguageRegistry      │
        │ IncrementalState      │
        └───────────┬───────────┘
                    ↓
        ┌───────────────────────┐
        │ tree-sitter C API     │
        │ (vendor/tree-sitter/) │
        └───────────┬───────────┘
                    ↓
        ┌───────────────────────┐
        │ 语言语法库             │
        │ (vendor/grammars/)    │
        │ 16 种语言             │
        └───────────────────────┘
```

## TypeScript API

### 模块接口

```typescript
// modules/tree-sitter/src/TreeSitterModule.ts
import { requireNativeModule } from 'expo-modules-core';

interface TreeSitterModule {
  // Parser 生命周期
  initParser(languageId: string): Promise<number>;        // → parserId
  parse(parserId: number, source: string): Promise<number>; // → treeId
  deleteParser(parserId: number): void;
  deleteTree(treeId: number): void;

  // 查询 API（返回二进制缓冲区）
  highlight(treeId: number, querySource: string): Promise<Uint8Array>;
  getFoldingRanges(treeId: number, querySource: string): Promise<Uint8Array>;
  getSymbols(treeId: number, querySource: string): Promise<Uint8Array>;
  executeQuery(treeId: number, querySource: string): Promise<Uint8Array>;

  // 增量解析 API
  createSession(source: string, languageId: string): Promise<number>;  // → sessionId
  editSession(sessionId: number, startByte: number, oldEndByte: number,
              newEndByte: number, newSource: string): Promise<void>;
  sessionHighlight(sessionId: number): Promise<Uint8Array>;
  destroySession(sessionId: number): void;

  // 高层便捷 API（内部调用 parse + query + delete）
  highlightSource(source: string, languageId: string): Promise<Uint8Array>;
  foldRanges(source: string, languageId: string): Promise<Uint8Array>;
  symbolOutline(source: string, languageId: string): Promise<Uint8Array>;
}

export default requireNativeModule<TreeSitterModule>('TreeSitter');
```

### 反序列化后的 TypeScript 类型

```typescript
// modules/tree-sitter/src/types.ts

export interface HighlightCapture {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  captureName: string;  // "keyword", "string", "function", etc.
}

export interface FoldingRange {
  startRow: number;
  endRow: number;
  kind: 'comment' | 'imports' | 'region' | 'block';
}

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'method' | 'variable' | 'interface' | 'type' | 'enum';
  startRow: number;
  endRow: number;
  children: SymbolInfo[];
}

export interface QueryMatch {
  patternIndex: number;
  captures: Array<{
    name: string;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    text: string;
  }>;
}
```

### React Hook 封装

```typescript
// modules/tree-sitter/src/useTreeSitter.ts
import { useState, useEffect } from 'react';
import TreeSitterModule from './TreeSitterModule';
import { deserializeHighlights, deserializeFolds, deserializeSymbols } from './deserialize';
import type { HighlightCapture, FoldingRange, SymbolInfo } from './types';

export function useTreeSitter(source: string, languageId: string) {
  const [highlights, setHighlights] = useState<HighlightCapture[]>([]);
  const [folds, setFolds] = useState<FoldingRange[]>([]);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function parse() {
      setIsLoading(true);
      try {
        const [hlBuffer, foldBuffer, symbolBuffer] = await Promise.all([
          TreeSitterModule.highlightSource(source, languageId),
          TreeSitterModule.foldRanges(source, languageId),
          TreeSitterModule.symbolOutline(source, languageId),
        ]);

        if (!cancelled) {
          setHighlights(deserializeHighlights(hlBuffer));
          setFolds(deserializeFolds(foldBuffer));
          setSymbols(deserializeSymbols(symbolBuffer));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    parse();
    return () => { cancelled = true; };
  }, [source, languageId]);

  return { highlights, folds, symbols, isLoading };
}
```

## 二进制序列化协议

### 设计理由

| 方案 | 1000 行代码（~4000 span） | 解析耗时 |
|------|--------------------------|---------|
| JSON | ~500KB | 50-100ms |
| 二进制 Uint8Array | ~100KB | <5ms |

**结论**：二进制方案小 5 倍，读取快 10-20 倍，满足 100ms 总预算。

### 缓冲区布局

所有数值为 **little-endian**。

#### HighlightSpan（每项 20 字节）

```
偏移    类型      字段
[0..3]  uint32    startByte      # 源码中的起始字节位置
[4..7]  uint32    endByte        # 源码中的结束字节位置
[8..9]  uint16    startRow       # 起始行号
[10..11] uint16   startCol       # 起始列号
[12..13] uint16   endRow         # 结束行号
[14..15] uint16   endCol         # 结束列号
[16..17] uint16   scopeId        # 索引到 SCOPE_NAMES 表
[18..19] uint16   reserved       # 保留对齐
```

#### FoldRange（每项 6 字节）

```
偏移    类型      字段
[0..1]  uint16    startRow       # 折叠区域起始行
[2..3]  uint16    endRow         # 折叠区域结束行
[4]     uint8     kind           # 0=block, 1=comment, 2=imports, 3=region
[5]     uint8     padding        # 对齐填充
```

#### SymbolInfo（每项 16 字节）

```
偏移    类型      字段
[0..3]  uint32    nameOffset     # 指向附加字符串表的偏移
[4..5]  uint16    nameLength     # 名称长度（字节）
[6..7]  uint16    startRow       # 符号起始行
[8..9]  uint16    startCol       # 符号起始列
[10..11] uint16   endRow         # 符号结束行
[12..13] uint16   endCol         # 符号结束列
[14]    uint8     kind           # 0=function, 1=class, 2=method, ...
[15]    uint8     depth          # 嵌套深度（0=顶层）
```

### 传输机制

Expo Modules API 的 `Data`（iOS）/ `ByteArray`（Android）直接映射到 JS 的 `Uint8Array`，仅一次内存拷贝，无序列化开销。

### JS 反序列化示例

```typescript
// modules/tree-sitter/src/deserialize.ts
import { SCOPE_NAMES } from './constants';

const HIGHLIGHT_SPAN_SIZE = 20;

export function deserializeHighlights(buffer: Uint8Array): HighlightCapture[] {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const count = buffer.byteLength / HIGHLIGHT_SPAN_SIZE;
  const results: HighlightCapture[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const offset = i * HIGHLIGHT_SPAN_SIZE;
    results[i] = {
      startRow: view.getUint16(offset + 8, true),
      startCol: view.getUint16(offset + 10, true),
      endRow: view.getUint16(offset + 12, true),
      endCol: view.getUint16(offset + 14, true),
      captureName: SCOPE_NAMES[view.getUint16(offset + 16, true)] ?? 'unknown',
    };
  }

  return results;
}
```

## Scope 名称表

```typescript
// modules/tree-sitter/src/constants.ts
export const SCOPE_NAMES: string[] = [
  'keyword',              // 0
  'keyword.control',      // 1
  'keyword.function',     // 2
  'keyword.operator',     // 3
  'keyword.return',       // 4
  'keyword.import',       // 5
  'string',               // 6
  'string.escape',        // 7
  'string.regex',         // 8
  'comment',              // 9
  'comment.block',        // 10
  'number',               // 11
  'number.float',         // 12
  'boolean',              // 13
  'constant',             // 14
  'function',             // 15
  'function.builtin',     // 16
  'function.call',        // 17
  'method',               // 18
  'method.call',          // 19
  'type',                 // 20
  'type.builtin',         // 21
  'type.parameter',       // 22
  'variable',             // 23
  'variable.builtin',     // 24
  'variable.parameter',   // 25
  'property',             // 26
  'property.definition',  // 27
  'operator',             // 28
  'punctuation',          // 29
  'punctuation.bracket',  // 30
  'punctuation.delimiter',// 31
  'tag',                  // 32
  'attribute',            // 33
  'namespace',            // 34
  'label',                // 35
];
```

## 共享 C++ 核心层

### TreeSitterCore — 主编排类

```cpp
// cpp/TreeSitterCore.h
#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include "ParserPool.h"
#include "QueryEngine.h"
#include "ResultSerializer.h"
#include "LanguageRegistry.h"
#include "IncrementalState.h"

namespace gitmob::treesitter {

using SerializedResult = std::vector<uint8_t>;
using TreeHandle = uint64_t;

class TreeSitterCore {
public:
    static TreeSitterCore& instance();

    // 初始化（加载查询文件基础路径）
    bool initialize(const std::string& queryBasePath);

    // 一次性 API（内部管理 parser 生命周期）
    SerializedResult highlight(const std::string& source, const std::string& language);
    SerializedResult foldRanges(const std::string& source, const std::string& language);
    SerializedResult symbolOutline(const std::string& source, const std::string& language);

    // 增量解析 API
    TreeHandle createSession(const std::string& source, const std::string& language);
    void editSession(TreeHandle handle, uint32_t startByte, uint32_t oldEndByte,
                     uint32_t newEndByte, const std::string& newSource);
    SerializedResult sessionHighlight(TreeHandle handle);
    void destroySession(TreeHandle handle);

private:
    TreeSitterCore() = default;
    ParserPool parserPool_;
    QueryEngine queryEngine_;
    ResultSerializer serializer_;
    LanguageRegistry languageRegistry_;
    IncrementalStateManager incrementalState_;
};

} // namespace gitmob::treesitter
```

### ParserPool — 线程安全 Parser 池

```cpp
// cpp/ParserPool.h
#pragma once
#include <string>
#include <mutex>
#include <unordered_map>
#include <vector>
#include <tree_sitter/api.h>

namespace gitmob::treesitter {

class ParserPool {
public:
    // 注册语言（应用初始化时调用）
    void registerLanguage(const std::string& name, const TSLanguage* lang);

    // 独占获取一个 parser（已设置好语言）
    TSParser* acquire(const std::string& language);

    // 归还 parser 到池中
    void release(const std::string& language, TSParser* parser);

    ~ParserPool();

private:
    std::mutex mutex_;
    std::unordered_map<std::string, const TSLanguage*> languages_;
    std::unordered_map<std::string, std::vector<TSParser*>> pools_;
};

} // namespace gitmob::treesitter
```

**工作方式**：
- `acquire()` 从池中取出一个 parser，如果池空则 `ts_parser_new()` 创建新的
- `release()` 将 parser 归还到池中，避免重复 alloc/dealloc
- 每种语言独立池，因为 `ts_parser_set_language()` 有一定开销

### QueryEngine — 查询执行与缓存

```cpp
// cpp/QueryEngine.h
#pragma once
#include <string>
#include <unordered_map>
#include <mutex>
#include <tree_sitter/api.h>

namespace gitmob::treesitter {

class QueryEngine {
public:
    // 初始化查询文件基础路径
    void setQueryBasePath(const std::string& path);

    // 获取或编译查询（缓存已编译的 TSQuery）
    TSQuery* getQuery(const TSLanguage* lang, const std::string& language,
                      const std::string& queryType);  // "highlights", "folds", "outline"

    // 执行高亮查询
    std::vector<HighlightSpan> executeHighlight(TSTree* tree, TSQuery* query,
                                                 const std::string& source);

    // 执行折叠范围查询
    std::vector<FoldRange> executeFoldRanges(TSTree* tree, TSQuery* query);

    // 执行符号查询
    std::vector<SymbolEntry> executeSymbolOutline(TSTree* tree, TSQuery* query,
                                                   const std::string& source);

    ~QueryEngine();

private:
    std::string queryBasePath_;
    std::mutex mutex_;
    // key: "language/queryType" → compiled TSQuery
    std::unordered_map<std::string, TSQuery*> queryCache_;
};

} // namespace gitmob::treesitter
```

**查询编译策略**：初始化时预编译所有注册语言的查询并缓存。查询文件（.scm）体积小，编译快速。

### ResultSerializer — 二进制序列化

```cpp
// cpp/ResultSerializer.h
#pragma once
#include <vector>
#include <cstdint>

namespace gitmob::treesitter {

struct HighlightSpan {
    uint32_t startByte, endByte;
    uint16_t startRow, startCol, endRow, endCol;
    uint16_t scopeId;
};

struct FoldRange {
    uint16_t startRow, endRow;
    uint8_t kind;
};

struct SymbolEntry {
    std::string name;
    uint16_t startRow, startCol, endRow, endCol;
    uint8_t kind;
    uint8_t depth;
};

class ResultSerializer {
public:
    std::vector<uint8_t> serializeHighlights(const std::vector<HighlightSpan>& spans);
    std::vector<uint8_t> serializeFoldRanges(const std::vector<FoldRange>& ranges);
    std::vector<uint8_t> serializeSymbols(const std::vector<SymbolEntry>& symbols);
};

} // namespace gitmob::treesitter
```

### IncrementalStateManager — 增量解析会话

```cpp
// cpp/IncrementalState.h
#pragma once
#include <cstdint>
#include <mutex>
#include <unordered_map>
#include <tree_sitter/api.h>

namespace gitmob::treesitter {

struct SessionState {
    TSParser* parser;
    TSTree* tree;
    std::string source;
    std::string language;
    std::mutex mutex;  // per-session 锁
};

class IncrementalStateManager {
public:
    uint64_t createSession(TSParser* parser, TSTree* tree,
                           const std::string& source, const std::string& language);
    SessionState* getSession(uint64_t handle);
    void destroySession(uint64_t handle);

private:
    std::mutex mapMutex_;
    std::unordered_map<uint64_t, std::unique_ptr<SessionState>> sessions_;
    uint64_t nextHandle_ = 1;
};

} // namespace gitmob::treesitter
```

### LanguageRegistry — 语言注册

```cpp
// cpp/LanguageRegistry.h
#pragma once
#include <string>
#include <unordered_map>
#include <tree_sitter/api.h>

namespace gitmob::treesitter {

class LanguageRegistry {
public:
    void registerBuiltinLanguages();  // 注册所有编译进二进制的语言

    const TSLanguage* getLanguage(const std::string& languageId) const;
    std::string detectLanguage(const std::string& filename) const;

    // 文件扩展名 → 语言 ID 映射
    static const std::unordered_map<std::string, std::string>& extensionMap();

private:
    std::unordered_map<std::string, const TSLanguage*> languages_;
};

} // namespace gitmob::treesitter
```

## CMake 构建配置

```cmake
# cpp/CMakeLists.txt
cmake_minimum_required(VERSION 3.18)
project(treesitter-core)

set(CMAKE_CXX_STANDARD 17)

# tree-sitter C 运行时
add_library(tree-sitter STATIC
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/tree-sitter/lib/src/lib.c
)
target_include_directories(tree-sitter PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/tree-sitter/lib/include
)

# 语言语法库（16 种语言）
add_library(tree-sitter-grammars STATIC
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-javascript/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-javascript/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-typescript/typescript/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-typescript/typescript/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-typescript/tsx/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-typescript/tsx/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-python/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-python/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-go/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-rust/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-rust/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-java/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-c/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-cpp/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-cpp/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-swift/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-swift/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-kotlin/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-kotlin/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-ruby/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-ruby/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-json/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-yaml/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-yaml/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-markdown/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-markdown/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-css/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-css/src/scanner.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-html/src/parser.c
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-html/src/scanner.c
)

# 语法库包含路径
file(GLOB GRAMMAR_DIRS "${CMAKE_CURRENT_SOURCE_DIR}/../vendor/grammars/tree-sitter-*/src")
foreach(dir ${GRAMMAR_DIRS})
    get_filename_component(parent ${dir} DIRECTORY)
    target_include_directories(tree-sitter-grammars PRIVATE ${parent}/src)
endforeach()

target_link_libraries(tree-sitter-grammars PUBLIC tree-sitter)

# 共享 C++ 核心层
add_library(treesitter-core STATIC
    TreeSitterCore.cpp
    ParserPool.cpp
    QueryEngine.cpp
    ResultSerializer.cpp
    LanguageRegistry.cpp
    IncrementalState.cpp
)

target_include_directories(treesitter-core PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/../vendor/tree-sitter/lib/include
)

target_link_libraries(treesitter-core PUBLIC tree-sitter tree-sitter-grammars)
```

## iOS 桥接

### Swift Module（Expo Module DSL）

```swift
// ios/TreeSitterModule.swift
import ExpoModulesCore

public class TreeSitterModule: Module {
    private let bridge = TreeSitterBridge()

    public func definition() -> ModuleDefinition {
        Name("TreeSitter")

        OnCreate {
            let queryPath = Bundle.main.path(forResource: "queries", ofType: nil) ?? ""
            bridge.initialize(queryBasePath: queryPath)
        }

        AsyncFunction("highlightSource") { (source: String, languageId: String) -> Data in
            return bridge.highlight(source: source, language: languageId)
        }

        AsyncFunction("foldRanges") { (source: String, languageId: String) -> Data in
            return bridge.foldRanges(source: source, language: languageId)
        }

        AsyncFunction("symbolOutline") { (source: String, languageId: String) -> Data in
            return bridge.symbolOutline(source: source, language: languageId)
        }

        // ... 增量解析 API 同理
    }
}
```

### Obj-C++ 桥接

```objc
// ios/bridge/TreeSitterBridge.h
#import <Foundation/Foundation.h>

@interface TreeSitterBridge : NSObject

- (void)initializeWithQueryBasePath:(NSString *)path;
- (NSData *)highlightWithSource:(NSString *)source language:(NSString *)language;
- (NSData *)foldRangesWithSource:(NSString *)source language:(NSString *)language;
- (NSData *)symbolOutlineWithSource:(NSString *)source language:(NSString *)language;

@end
```

```objc
// ios/bridge/TreeSitterBridge.mm
#import "TreeSitterBridge.h"
#include "TreeSitterCore.h"

@implementation TreeSitterBridge

- (void)initializeWithQueryBasePath:(NSString *)path {
    gitmob::treesitter::TreeSitterCore::instance().initialize(path.UTF8String);
}

- (NSData *)highlightWithSource:(NSString *)source language:(NSString *)language {
    auto result = gitmob::treesitter::TreeSitterCore::instance()
        .highlight(source.UTF8String, language.UTF8String);
    return [NSData dataWithBytes:result.data() length:result.size()];
}

- (NSData *)foldRangesWithSource:(NSString *)source language:(NSString *)language {
    auto result = gitmob::treesitter::TreeSitterCore::instance()
        .foldRanges(source.UTF8String, language.UTF8String);
    return [NSData dataWithBytes:result.data() length:result.size()];
}

- (NSData *)symbolOutlineWithSource:(NSString *)source language:(NSString *)language {
    auto result = gitmob::treesitter::TreeSitterCore::instance()
        .symbolOutline(source.UTF8String, language.UTF8String);
    return [NSData dataWithBytes:result.data() length:result.size()];
}

@end
```

### CocoaPods 配置

```ruby
# ios/TreeSitterModule.podspec
Pod::Spec.new do |s|
  s.name           = 'TreeSitterModule'
  s.version        = '1.0.0'
  s.summary        = 'Tree-sitter native module for GitMob'
  s.homepage       = 'https://github.com/user/gitmob'
  s.license        = 'MIT'
  s.author         = 'GitMob'
  s.source         = { git: '' }
  s.platform       = :ios, '15.0'

  s.swift_version  = '5.9'

  s.source_files   = [
    'TreeSitterModule.swift',
    'bridge/**/*.{h,mm}',
    '../cpp/**/*.{h,cpp}',
    '../vendor/tree-sitter/lib/src/lib.c',
    '../vendor/grammars/*/src/*.c',
  ]

  s.public_header_files = 'bridge/TreeSitterBridge.h'

  s.preserve_paths = [
    '../vendor/**/*',
    '../cpp/**/*',
    '../queries/**/*',
  ]

  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => [
      '$(PODS_TARGET_SRCROOT)/../vendor/tree-sitter/lib/include',
      '$(PODS_TARGET_SRCROOT)/../vendor/tree-sitter/lib/src',
    ].join(' '),
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'GCC_PREPROCESSOR_DEFINITIONS' => 'TREE_SITTER_HIDE_SYMBOLS=1',
  }

  s.resource_bundles = {
    'TreeSitterQueries' => ['../queries/**/*.scm'],
  }

  s.dependency 'ExpoModulesCore'
end
```

## Android 桥接

### Kotlin Module（Expo Module DSL）

```kotlin
// android/src/main/java/expo/modules/treesitter/TreeSitterModule.kt
package expo.modules.treesitter

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TreeSitterModule : Module() {
    private val bridge = TreeSitterBridge()

    override fun definition() = ModuleDefinition {
        Name("TreeSitter")

        OnCreate {
            val queryPath = context.assets  // Android assets 路径
            bridge.initialize(queryPath.toString())
        }

        AsyncFunction("highlightSource") { source: String, languageId: String ->
            bridge.highlight(source, languageId)
        }

        AsyncFunction("foldRanges") { source: String, languageId: String ->
            bridge.foldRanges(source, languageId)
        }

        AsyncFunction("symbolOutline") { source: String, languageId: String ->
            bridge.symbolOutline(source, languageId)
        }
    }
}
```

### JNI 桥接

```cpp
// android/src/main/jni/TreeSitterJNI.cpp
#include <jni.h>
#include "TreeSitterCore.h"

extern "C" {

JNIEXPORT void JNICALL
Java_expo_modules_treesitter_TreeSitterBridge_nativeInitialize(
    JNIEnv* env, jobject thiz, jstring queryBasePath) {
    const char* path = env->GetStringUTFChars(queryBasePath, nullptr);
    gitmob::treesitter::TreeSitterCore::instance().initialize(path);
    env->ReleaseStringUTFChars(queryBasePath, path);
}

JNIEXPORT jbyteArray JNICALL
Java_expo_modules_treesitter_TreeSitterBridge_nativeHighlight(
    JNIEnv* env, jobject thiz, jstring source, jstring language) {
    const char* src = env->GetStringUTFChars(source, nullptr);
    const char* lang = env->GetStringUTFChars(language, nullptr);

    auto result = gitmob::treesitter::TreeSitterCore::instance().highlight(src, lang);

    env->ReleaseStringUTFChars(source, src);
    env->ReleaseStringUTFChars(language, lang);

    jbyteArray jResult = env->NewByteArray(result.size());
    env->SetByteArrayRegion(jResult, 0, result.size(),
                            reinterpret_cast<const jbyte*>(result.data()));
    return jResult;
}

// ... foldRanges, symbolOutline 同理

} // extern "C"
```

### Gradle 配置

```kotlin
// android/build.gradle.kts
plugins {
    id("com.android.library")
    kotlin("android")
}

android {
    namespace = "expo.modules.treesitter"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        externalNativeBuild {
            cmake {
                cppFlags("-std=c++17")
                arguments("-DANDROID_STL=c++_shared")
            }
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/jni/CMakeLists.txt")
        }
    }
}
```

## 查询文件（.scm）

### JavaScript highlights.scm（示例）

```scheme
; Keywords
["const" "let" "var" "function" "return" "if" "else" "for" "while"
 "do" "switch" "case" "break" "continue" "throw" "try" "catch"
 "finally" "new" "delete" "typeof" "instanceof" "in" "of"
 "class" "extends" "super" "import" "export" "default" "from"
 "async" "await" "yield" "static" "get" "set"] @keyword

; Strings
(string) @string
(template_string) @string
(escape_sequence) @string.escape
(regex) @string.regex

; Numbers
(number) @number

; Comments
(comment) @comment

; Functions
(function_declaration name: (identifier) @function)
(arrow_function) @function
(method_definition name: (property_identifier) @method)
(call_expression function: (identifier) @function.call)
(call_expression function: (member_expression property: (property_identifier) @method.call))

; Types / Classes
(class_declaration name: (identifier) @type)
(new_expression constructor: (identifier) @type)

; Variables & Properties
(identifier) @variable
(property_identifier) @property
(shorthand_property_identifier) @property

; Operators
["=" "+=" "-=" "*=" "/=" "+" "-" "*" "/" "%" "==" "===" "!=" "!=="
 "<" ">" "<=" ">=" "&&" "||" "!" "??" "?." "..." "=>" "?"] @operator

; Punctuation
["{" "}" "(" ")" "[" "]"] @punctuation.bracket
[";" "," "." ":"] @punctuation.delimiter
```

### JavaScript folds.scm

```scheme
(function_declaration body: (statement_block) @fold)
(class_declaration body: (class_body) @fold)
(method_definition body: (statement_block) @fold)
(arrow_function body: (statement_block) @fold)
(if_statement consequence: (statement_block) @fold)
(else_clause (statement_block) @fold)
(for_statement body: (statement_block) @fold)
(while_statement body: (statement_block) @fold)
(try_statement body: (statement_block) @fold)
(catch_clause body: (statement_block) @fold)
(switch_statement body: (switch_body) @fold)
(object) @fold
(array) @fold
(import_statement) @fold.imports
(comment) @fold.comment
```

### JavaScript outline.scm

```scheme
(function_declaration
  name: (identifier) @symbol.name) @symbol.function

(class_declaration
  name: (identifier) @symbol.name) @symbol.class

(method_definition
  name: (property_identifier) @symbol.name) @symbol.method

(lexical_declaration
  (variable_declarator
    name: (identifier) @symbol.name
    value: (arrow_function))) @symbol.function

(export_statement
  declaration: (function_declaration
    name: (identifier) @symbol.name)) @symbol.function
```

## 支持的语言列表

| 语言 | 语法包 | 预计包体积 |
|------|--------|-----------|
| JavaScript | tree-sitter-javascript | ~200KB |
| TypeScript | tree-sitter-typescript | ~350KB |
| TSX | tree-sitter-typescript/tsx | 包含在上 |
| Python | tree-sitter-python | ~150KB |
| Go | tree-sitter-go | ~200KB |
| Rust | tree-sitter-rust | ~300KB |
| Java | tree-sitter-java | ~150KB |
| C | tree-sitter-c | ~100KB |
| C++ | tree-sitter-cpp | ~400KB |
| Swift | tree-sitter-swift | ~300KB |
| Kotlin | tree-sitter-kotlin | ~200KB |
| Ruby | tree-sitter-ruby | ~150KB |
| JSON | tree-sitter-json | ~30KB |
| YAML | tree-sitter-yaml | ~80KB |
| Markdown | tree-sitter-markdown | ~100KB |
| CSS | tree-sitter-css | ~80KB |
| HTML | tree-sitter-html | ~80KB |

**总计**：约 2.5-3.5MB（编译后），在可接受范围内。

## 性能预算

| 步骤 | 预计耗时 | 说明 |
|------|---------|------|
| tree-sitter 解析 | 1-5ms | C 原生解析，极快 |
| highlight 查询执行 | 5-15ms | 预编译查询，游标遍历 |
| 二进制序列化 | <1ms | 内存拷贝，无格式化 |
| 桥接传输 | <2ms | Data/ByteArray → Uint8Array，100KB 单次拷贝 |
| JS DataView 反序列化 | <5ms | 固定大小记录，O(n) 读取 |
| **总计** | **15-30ms** | **远低于 100ms 预算** |
