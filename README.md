# Web ZK Extension

## Web ZK Extension

This project is designed to facilitate the efficient downloading and storage of large zero-knowledge (ZK) circuits. It
enables seamless integration with decentralized applications (DApps) by providing these circuits for use in various
proving methods such as Groth16 and similar approaches. The goal is to optimize the handling of large circuits, ensuring
DApps can easily access and use them for cryptographic proofs within their workflows.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Features](#features)

## Getting Started

This project is self-sufficient to get started. It includes functionality to automatically start a browser and install
the extension without requiring additional manual steps. Simply follow the setup instructions to begin using the project
seamlessly.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lukachi/web-zk-extension
   ```
2. Navigate to the project directory:
   ```bash
   cd web-zk-extension
   ```
3. Install dependencies using `pnpm`:
   ```bash
   pnpm install
   ```

## Usage

Provide examples or walkthroughs for running and interacting with the project.

To start the development environment, there are two ways:

1. Using `pnpm dev`:
   ```bash
   pnpm run dev
   ```
   This starts the development server with Hot Module Replacement (HMR) for quick updates during development.

2. Using `pnpm build:watch`:
   ```bash
   pnpm run build:watch
   ```
   This method is more efficient when working with updates to injected scripts and content-scripts, while still
   providing HMR for popup content.

## Features

This project currently provides two external methods. After the extension starts, it injects a variable called `zkExt`
into the `window` object. This variable provides the `request` and `on` methods:

The `request` method accepts object of type [ExtensionMessage](./src/helpers/background.ts)

current handlers is:

### Methods

1. `addCircuit`
  - **Description**: Adds a new circuit to the extension for future use.
  - **Parameters**: object of type [Circuit](./src/store/modules/circuits.ts)
  - **example**:
```typescript
await window.zkExt.request({
  id: uuid(),
  method: 'addCircuit',
  data: {
    iconUrl: '',
    name: 'zkLivenessFieldBits',
    zKey: {
      url: 'https://example.com/myCoolCircuit/circuit_final.zkey',
      version: '1.0.0',
    },
    wasm: {
      url: 'https://example.com/myCoolCircuit/wtns_calculator.wasm',
      version: '1.0.0',
    },
    description: 'My cool circuits',
    tag: 'cool',
  },
})
```

2. `getCircuit`
  - **Description**: Retrieves a stored circuit by its name. **Important note**, that since circuits could be very large, this method provides retrieving it with `ReadableStream`
  - **Parameters**: object of type

```typescript
{
  name: string
  type: 'zkey' | 'wasm'
}
```
  - **example**:
```typescript
const loadCircuit = async (name: string, type: 'zkey' | 'wasm') => {
  const stream = await window.zkExt.request({
    method: 'getCircuit',
    data: { name, type },
  })

  const response = new Response(stream)

  const reader = response.body?.getReader()

  if (!reader) throw new Error('No reader')

  const chunks = []

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    if (value) {
      chunks.push(Buffer.from(value, 'base64'))
    }
  }

  return Buffer.concat(chunks)
}
```

The `on` methods allows to subscribe to events, that emits from `background service worker`.

Currently emitting events:
1. `circuit_loading_progress` - if circuit is loading, this event track current loading progress
2. `circuit_loading_error` - if there is an error while loading a circuit, this event provides details about the error.

Return type for each event you could check in [PegasusEventProtocolMap](./src/background.ts)

```typescript
window.zkExt.on({
  event: 'circuit_loading_progress',
  listener: (msg: { data: { name: string; progress: number } }) => {
    console.log(msg)
  },
})
```
