import { serve } from "https://deno.land/std/http/server.ts";
import { execute, addInterceptors, ContextDefaults, InterceptorError } from './core.js';
import { Record } from 'https://cdn.pika.dev/immutable@^4.0.0-rc.12';

//const server = serve({ port: 8000 });
//console.log("http://localhost:8000/");

//for await (const req of server) {
//req.respond(context.response!);
//}

const interceptors = [{name: "add-1", enter: (ctx) => ctx.update('count', count => count + 1)},
                      {name: "add-2", enter: (ctx) => ctx.update('count', count => count + 1)},
		      {name: "remove-1", leave: (ctx) => ctx.update('count', count => count - 1)},
		      {name: "remove-2", leave: (ctx) => ctx.update('count', count => count - 1)},
		      {name: "error-1", enter: (ctx) => {throw new Error("uh oh")}},]

const contextFactory = ContextDefaults({count: 0});
const initialContext = addInterceptors(contextFactory(), ...interceptors);
const resultContext = await execute(initialContext);

console.log(JSON.stringify(resultContext));
