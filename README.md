# React-From-Scratch

This is a simple implementation of React using custom code.

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