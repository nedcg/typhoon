import { serve } from "https://deno.land/std/http/server.ts";
import { execute, addInterceptors, ContextDefaults } from './core.js';
import { Map, Record, is, fromJS } from 'https://cdn.pika.dev/immutable@^4.0.0-rc.12';
import { ServerRequest } from "https://deno.land/std/http/server.ts"

const Response = Record({
    status: null,
    body: null,
    headers: Map(),
});

const WebContext = ContextDefaults({
    request: null,
    response: Response()
});

function header(context, name, value) {
    return context.setIn(['response', 'headers', name], value);
}

function status(context, status) {
    return context.setIn(['response', 'status'], status);
}

function ok(context, body) {
    return status(context, 200)
	.setIn(['response', 'body'], body);
}

function serverRequestRecord({url, method, proto, protoMinor, protoMajor, headers, conn, r}) {
    return Record({url, method, proto, protoMinor, protoMajor, conn, headers, body: r})()
}

function webContext(serverRequest) {
    return 
}

function handler(handlerFn) {
    return {
	enter: (ctx) => ctx.set('response', Map(handlerFn(ctx.request)))
    }
}

export async function makeServer(options, handler, ...interceptors) {
    const server = serve(options);
    console.log("http://localhost:8000/");

    for await (const req of server) {
	const webContext = WebContext({request: serverRequestRecord(req)})
	const ctx = await execute(addInterceptors(webContext, ...interceptors));
	req.respond(ctx.get('response').toJS());
    }
}

export const response = {
    ok, status, header
};

Deno.test("#1", async () => {});

makeServer({port: 3000}, handler((req) => ({status: 200, body: "ok"})));
