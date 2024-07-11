# React-From-Scratch

This is a simple implementation of React using custom code.

## How it works

RScratch uses a concept called the **Fiber-Tree** to manage and update the user interface efficiently. Here's a simple explanation:

- **Fiber-Tree**: Think of the Fiber-Tree as a map that helps RScratch keep track of all the elements on the screen. Each element (like a button or a text) is a "fiber" in this tree. This tree structure allows RScratch to update only the parts of the screen that need to change, rather than redrawing everything from scratch.

- **Work Loop**: RScratch uses a loop to process updates. It breaks down the work into small units and processes them one by one. This way, it can pause and resume work, making sure the app remains responsive and doesn't freeze.

- **Interrupts**: If there's a lot of work to do, RScratch can pause and let the browser handle other tasks (like user interactions) before resuming. This makes the app feel smooth and responsive.

### What RScratch Does Have

- **Element Creation**: You can create elements using `RScratch.createElement`, similar to how you would in React.
- **State Management**: RScratch provides a `useState` hook to manage state in function components.
- **Rendering**: RScratch can render elements to the DOM and update them efficiently.

## What RScratch Does Not Have

- **Tree Walking During Render Phase**: In RScratch, we walk the whole tree during the render phase. React, on the other hand, follows some hints and heuristics to skip entire sub-trees where nothing changed.
- **Tree Walking During Commit Phase**: RScratch walks the whole tree in the commit phase. React keeps a linked list with just the fibers that have effects and only visits those fibers.
- **Fiber Recycling**: Every time we build a new work-in-progress tree, we create new objects for each fiber. React recycles the fibers from the previous trees.
- **Update Handling**: When RScratch receives a new update during the render phase, it throws away the work-in-progress tree and starts again from the root. React tags each update with an expiration timestamp and uses it to decide which update has a higher priority.

## What I Would Like to Add

- Use an object for the style prop
- Flatten children arrays
- `useEffect` hook
- Reconciliation by key

## Getting Started

To learn how to use the RScratch library, please refer to the [RScratch Tutorial](RScratchTutorial.md). The tutorial provides a step-by-step guide on creating elements, rendering them, and managing state with hooks.