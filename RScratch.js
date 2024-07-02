/**
 * TODO
 * --IMPLEMENT HOOKS
 * --REFACTOR
 * --CONCISE COMMENTS
 * --UPDATE README
 */

// I am currently only allowing 2 parameters with a rest parameter for children
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



function createDom(fiber) {
  // Create DOM nodes (DOM is a tree of objects, making it possible for javascript to interact and manipulate web pages)
  const dom =
    //Handling text element
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  //Assign element props to the node
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });
  //Render each child node
  return dom;
}



// For event listeners
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);



// update the existing DOM node with the props that changed.
function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
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

  //Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}



// recursively append all the nodes to the dom.
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  // save a reference to that “last fiber tree we committed to the DOM”
  currentRoot = wipRoot;
  wipRoot = null;
}



function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParentFiber = fiber.parent;
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



// when removing a node we also need to keep going until we find a child with a DOM node.
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}



function render(element, container) {
  // Keep track of the root of fiber tree
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // a link to the old fiber, the fiber that we committed to the DOM in the previous commit phase.
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}



let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;



//Breaking down the component into small unit, and each time after we finsih a unit, we will let the browser interrupt the rendering if anything else needs to be done.
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
  // think of it as a setTimeout
  requestIdleCallback(workLoop);
}



requestIdleCallback(workLoop);



/**
 * Performs work and then returns nextUnitOfWork
 * add the element to the DOM
 * create the fibers for the element’s children
 * select the next unit of work
 * Using FiberTree, 1 fiber per element, each fiber = unitOfWork
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // Returns next unit of work
  // first try with the child, then with the sibling, then with the uncle, and so on.
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



function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}



function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}



// Here we will reconcile the old fibers with the new elements.
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    const newFiber = null;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    // if the old fiber and the new element have the same type, we can keep the DOM node and just update it with the new props
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
    // if the type is different and there is a new element, it means we need to create a new DOM node
    if (element && !sameType) {
      // Add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        // for the case where the element needs a new DOM node we tag the new fiber
        effectTag: "PLACEMENT",
      };
    }
    // if the types are different and there is an old fiber, we need to remove the old node
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
};



// when babel transpiles the JSX it will use the function we define.
/** @jsx RScratch.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>;
}
const element = <App name="foo" />;
const container = document.getElementById("root");
RScratch.render(element, container);