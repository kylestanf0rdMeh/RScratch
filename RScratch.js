// createElement: Creates an element with type, props, and children
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      // Wraps primitives in TEXT_ELEMENT to simplify, favoring simplicity over React's performance optimizations.
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

// createDom: Creates DOM nodes from fibers
function createDom(fiber) {
  // Create DOM nodes (DOM is a tree of objects, making it possible for javascript to interact and manipulate web pages)
  const dom =
    // Handling text element
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // Assign element props to the node
  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  // Render each child node
  return dom;
}

// Utility functions for DOM updates
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

// updateDom: Updates the DOM with new props
function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

// commitRoot: Commits the root fiber to the DOM
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  // Save a reference to that “last fiber tree we committed to the DOM”
  currentRoot = wipRoot;
  wipRoot = null;
}

// commitWork: Commits a fiber to the DOM
function commitWork(fiber) {
  if (!fiber) return;

  // Find the parent of the DOM Node
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// commitDeletion: Removes a fiber from the DOM
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

// render: Initializes the root fiber and starts the work loop
function render(element, container) {
  // Keep track of the root of fiber tree
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // A link to the old fiber, the fiber that we committed to the DOM in the previous commit phase.
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

// workLoop: Processes units of work and commits the root
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  // We use requestIdleCallback to make a loop
  // Think of it as a setTimeout
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

// performUnitOfWork: Performs work on a fiber and returns the next unit of work
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // Returns next unit of work
  // First try with the child, then with the sibling, then with the uncle, and so on.
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

let wipFiber = null;
let hookIndex = null;

// updateFunctionComponent: Updates a function component
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  // Add a hooks array to the fiber to support calling useState several times in the same component. 
  // And we keep track of the current hook index.
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

// useState: Hook to manage state in function components
function useState(initial) {
  // Check if we have an old hook. We check in the alternate of the fiber using the hook index.
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // If we have old hook, we copy the state from the old hook to the new hook, if we don’t we initialize the state.
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  // We get all the actions from the old hook queue, and then apply them one by one to the new hook state, so when we return the state it’s updated.
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  // Should also return a function to update the state, so we define a setState function that receives an action
  const setState = (action) => {
    hook.queue.push(action);
    // Set a new work in progress root as the next unit of work so the work loop can start a new render phase
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // Then we add the new hook to the fiber, increment the hook index by one, and return the state.
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

// updateHostComponent: Updates a host component
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

// reconcileChildren: Reconciles old fibers with new elements
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    // If the old fiber and the new element have the same type, we can keep the DOM node and just update it with the new props
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    // If the type is different and there is a new element, it means we need to create a new DOM node
    if (element && !sameType) {
      // Add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        // For the case where the element needs a new DOM node we tag the new fiber
        effectTag: "PLACEMENT",
      };
    }
    // If the types are different and there is an old fiber, we need to remove the old node
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

const RScratch = {
  createElement,
  render,
  useState,
};

/** @jsx RScratch.createElement */
function Counter() {
  const [state, setState] = RScratch.useState(1);
  return (
    <h1 onClick={() => setState((c) => c + 1)}>
      Count: {state}
    </h1>
  );
}

const element = <Counter />;
const container = document.getElementById("root");
RScratch.render(element, container);