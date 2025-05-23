import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: '9f8bd607d65a773665eed135bc3a09c7d8b1b53c', queries,  });
export default client;
  