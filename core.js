import {List, Stack, Record} from 'https://cdn.pika.dev/immutable@^4.0.0-rc.12';

class InterceptorError extends Error {
    constructor(stage, name, error) {
	super(name);
	this.stage = stage;
	this.name = name;
	this.error = error;
    }
}

function nextContextLeave(context) {
    return context.update('stack', stack => stack.pop());
}

function nextContextEnter(context) {
    const queue = context.get('queue');
    return context
	.set('queue', queue.shift())
	.set('stack', context.get('stack').push(queue.first()));
}

function setError(context, stage, name, error) {
    return context.set('error', new InterceptorError(stage, name, error))
}

async function processEnter(context) {
    const queue = context.get('queue');
    const stack = context.get('stack');

    if (queue.isEmpty()) {
	return context;
    }

    const {enter: enterFn, name} = queue.first();
    const nextContext = nextContextEnter(context);

    if (enterFn) {
        try {
	    return processEnter(enterFn(nextContext));
	} catch (err) {
            return setError(terminate(nextContext), 'enter', name, err);
	}
    }

    return processEnter(nextContext);
}

async function processLeave(context) {
    const stack = context.get('stack');

    if (stack.isEmpty()) {
	return context;
    }

    const {leave: leaveFn, name} = stack.peek();
    const nextContext = nextContextLeave(context);

    if (leaveFn) {
        try {
	    return processLeave(leaveFn(nextContext));
	} catch (err) {
            return setError(terminate(nextContext), 'leave', name, err);
	}
    }

    return processLeave(nextContext);
}

async function processError(context) {
    const stack = context.get('stack');
    const error = context.get('error');

    if(!error || stack.isEmpty()) {
	return context;
    }

    const {error: errorFn, name} = stack.peek();
    const nextContext = nextContextError(context);

    if (errorFn) {
        try {
	    return processError(errorFn(nextContext, error));
	} catch (err) {
            return setError(terminate(nextContext), 'error', name, err);
	}
    }

    return processError(newContext);
}

function terminate(context) {
    return context.delete('queue');
}

export function execute(context) {
    return processEnter(context)
	.then(enterContext => processLeave(enterContext))
	.then(leaveContext => processError(leaveContext));
}

export function addInterceptors(context, ...interceptors) {
    return context.update('queue', queue => queue.push(...interceptors));
}

const BaseContextProps = {queue: List(), stack: Stack(), error: null}
export const ContextDefaults = (ctx, ctxName='InterceptorContext') => Record({...ctx, ...BaseContextProps}, ctxName);
