import { ApolloServer, gql } from "apollo-server-azure-functions";
import { CosmosClient } from "@azure/cosmos";
const client = new CosmosClient(process.env.CosmosKey);
const typeDefs = gql`
    type Record {
        id: ID
        clientId: String
        base64: String,
        geolocation: String,
        imageUrl: String,
        recordId: Int,
        clientSecret: String
    }

    type Query {
        getForClient(clientId: String, clientSecret: String): [Record]!
    }
`;

const resolvers = {
    Query: {
        async getForClient(_, { clientId, clientSecret }: { clientId: string, clientSecret: string }) {
            let results = await client
                .database("trackaboutphotos")
                .container("photo_metadata")
                .items.query({
                    query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.clientSecret = @clientSecret",
                    parameters: [
                        {
                            name: "@clientId",
                            value: clientId
                        },
                        {
                            name: "@clientSecret",
                            value: clientSecret
                        }
                    ]
                })
                .fetchAll();

            return results.resources;
        }
    }
};

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    playground: process.env.NODE_ENV === "development"
 });

export default server.createHandler();