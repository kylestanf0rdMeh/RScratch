# RScratch Tutorial

Welcome to the RScratch tutorial! This guide will help you understand how to use the RScratch library to create and manage components, handle state, and render elements to the DOM.

## Table of Contents
1. [Introduction](#introduction)
2. [Creating Elements](#creating-elements)
3. [Rendering Elements](#rendering-elements)
4. [Using State with Hooks](#using-state-with-hooks)
5. [Example: Counter Component](#example-counter-component)

## Introduction

RScratch is a simplified version of React that allows you to create and manage components, handle state, and render elements to the DOM. It includes basic functionalities such as creating elements, updating the DOM, and managing state with hooks.

## Creating Elements

To create an element in RScratch, you use the `createElement` function. This function takes a type, props, and children as arguments and returns an element object.

```
const element = RScratch.createElement('div', { id: 'myDiv' }, 'Hello, RScratch!');
```

## Rendering Elements

To render an element to the DOM, you use the `render` function. This function takes an element and a container as arguments and initializes the root fiber, starting the work loop.

```
const container = document.getElementById('root');
RScratch.render(element, container);
```

## Using State with Hooks

RScratch provides a `useState` hook to manage state in function components. The `useState` hook takes an initial state as an argument and returns an array with the current state and a function to update the state.

```
function MyComponent() {
    const [state, setState] = RScratch.useState(0);
    return (
        <div>
            <p>Current state: {state}</p>
            <button onClick={() => setState(state + 1)}>
                Increment
            </button>
        </div>
    );
}
```

## Example: Counter Component

Let's create a simple counter component using RScratch. The counter will display a number and increment it each time the user clicks on it.

1. Define the `Counter` component using the `useState` hook to manage the count state.

```
/ @jsx RScratch.createElement /
function Counter() {
    const [state, setState] = RScratch.useState(1);
    return (
        <h1 onClick={() => setState((c) => c + 1)}>
            Count: {state}
        </h1>
    );
}
```

2. Create an element for the `Counter` component.

```
const element = <Counter />;
```

3. Get the container element from the DOM.

```
const container = document.getElementById('root');
```

4. Render the `Counter` component to the container.

```
RScratch.render(element, container);
```

5. Full example code:

```
/ @jsx RScratch.createElement /
function Counter() {
    const [state, setState] = RScratch.useState(1);
    return (
        <h1 onClick={() => setState((c) => c + 1)}>
            Count: {state}
        </h1>
    );
}
const element = <Counter />;
const container = document.getElementById('root');
RScratch.render(element, container);
```


## Conclusion

There you have it, a 'bare-bones' so to say React. I hope the tutorial proved succesful in enabling you to make RScratch code, and learn along the way as well. Please look at [RScratch.js](RScratch.js) to follow the code along, I left comments in it for a reason!