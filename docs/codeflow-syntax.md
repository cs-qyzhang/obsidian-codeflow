# Codeflow Syntax Guide

`codeflow` is a small indentation-based language for showing call relationships and lightweight pseudocode.

## 1. Code block fence

Write `codeflow` inside a fenced code block.

Example:

```codeflow
- app.py::main
  - server.py::start()
```

## 2. Indentation and hierarchy

Hierarchy is defined by leading spaces. A child line belongs to the nearest less-indented parent line.

Example:

```codeflow
- main()
  - init_config()
  - run_server()
    - accept_request()
```

Meaning:

- `init_config()` and `run_server()` are children of `main()`.
- `accept_request()` is a child of `run_server()`.

## 3. Bullet call nodes

Lines starting with `- ` are the main syntax for call-chain or step nodes.

Example:

```codeflow
- launch_server.py::main
  - http_server.py::launch_server()
  - engine.py::_launch_subprocesses()
```

Preview behavior:

- The source still uses `- `.
- The rendered preview hides the leading `-`.
- The rendered preview also removes whitespace immediately after that hidden `-`.

Typical uses:

- function call chain
- execution steps
- important events in a flow

## 4. Paths and scoped names

You can combine file paths with scoped names using `::`.

Example:

```codeflow
- managers/tokenizer_manager.py::TokenizerManager.generate_request()
  - managers/tokenizer_manager.py::TokenizerManager._tokenize_one_request()
```

Typical pattern:

- `path/to/file.py::function_name()`
- `path/to/file.py::ClassName.method_name()`

## 5. Function calls and statements

Any non-empty line can also be a normal statement. This is useful for assignments, object creation, and method calls.

Example:

```codeflow
- run_scheduler_process()
  scheduler = Scheduler()
  scheduler.event_loop_normal()
  scheduler.process_input_requests()
```

Common statement forms:

- assignment: `x = Foo()`
- call: `handle_request()`
- member call: `scheduler.run_batch()`
- mixed expression: `mp.Process(run_scheduler_process)`

## 6. Comments

Comments start with `#`.

### 6.1 Full-line comments

Example:

```codeflow
# bootstrap phase
- main()
```

### 6.2 Trailing comments

Example:

```codeflow
- load_model()  # expensive initialization
```

## 7. Inline Markdown syntax

`codeflow` supports a small set of inline Markdown markers inside a line.

These markers are rendered in the preview tree and highlighted in the editor.

### 7.1 Bold

Use `**text**` for bold emphasis.

Example:

```codeflow
- call **run_scheduler_process** now
```

### 7.2 Italic / emphasis

Use `*text*` for emphasis.

Example:

```codeflow
- parse *important* request first
- fallback to *slow_path*
```

### 7.3 Highlight

Use `==text==` for highlighted text.

Example:

```codeflow
- set state to ==RUNNING==
- ==critical path== starts here
```

Boundary rule:

- `==highlight==` is only recognized when it starts at a safe boundary.
- This prevents accidental highlighting in expressions like `if a==b:`.

### 7.4 Strikethrough

Use `~~text~~` for deprecated or skipped steps.

Example:

```codeflow
- ~~legacy_decode()~~
- decode_v2()
```

### 7.5 Mixed inline markdown

Inline markdown can be mixed with normal `codeflow` syntax.

Example:

```codeflow
- managers/scheduler.py::**run_scheduler_process**()
  if *scheduler_enabled*
    - set state to ==RUNNING==
  else
    - ~~skip_scheduler~~
```

## 8. Conditional syntax

`codeflow` supports lightweight condition blocks.

### 8.1 `if`

Example:

```codeflow
if request.is_stream
  - stream_response()
```

### 8.2 `elif`

Example:

```codeflow
if request.is_cache_hit
  - return_cached_result()
elif request.needs_prefill
  - run_prefill()
```

### 8.3 `else`

Example:

```codeflow
if request.is_valid
  - process_request()
else
  - reject_request()
```

## 9. Loop syntax

`codeflow` supports `for` and `while` for pseudocode-style loops.

### 9.1 `for ... in ...`

Example:

```codeflow
for worker in workers
  - worker.start()
```

### 9.2 `while`

Example:

```codeflow
while scheduler.is_running
  - scheduler.get_next_batch_to_run()
  - scheduler.run_batch()
```

## 10. Keyword highlighting behavior

Keywords are highlighted conservatively.

This means substrings inside identifiers are not treated as keywords.

Examples that should remain plain identifiers:

```codeflow
- a.function()
  b.what_if
  c.is_in
  d.do_while
  e.do_for
```

## 11. Mixed call flow and pseudocode

The main design goal of `codeflow` is to let call trees and pseudocode appear together in one block.

Example:

```codeflow
- tokenizer_manager.generate_request()
  - TokenizerManager._tokenize_one_request()
  if request.is_valid
    - TokenizerManager._send_one_request()
      - zmq.send_pyobj()
  else
    - reject_request()
```

## 12. Recommended style

- Use spaces for indentation.
- Prefer 2 spaces per level.
- Use `- ` for major flow nodes.
- Use plain statements for local details.
- Use `if/elif/else` and `for/while` only for lightweight pseudocode, not complex language semantics.

Recommended example:

```codeflow
- app.py::main
  - load_config()
  if config.enable_server
    - server.py::start()
      while server.is_running
        - accept_request()
  else
    - print("server disabled")
```

## 13. Current limits

Current plugin behavior is intentionally simple.

- No multi-line statements.
- No strict parser for expression grammar.
- No semantic validation of variables or function names.
- Indentation is structure; inconsistent indentation may render unexpectedly.
- Tabs are tolerated but spaces are recommended.
- Inline backtick code syntax is intentionally not supported, because `codeflow` already lives inside a code block.
