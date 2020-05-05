import { ApolloServer, gql } from "apollo-server-azure-functions";
import { CosmosClient } from "@azure/cosmos";
const client = new CosmosClient(process.env.CosmosKey);
const typeDefs = gql`
    type Record {
        id: ID
        clientId: String
        base64: String
        imageUrl: String
        recordId: Int
        metadata: Metadata
    }

    type Metadata {
        lat: Float
        lng: Float
        description: String
    }

    type Query {
        getForClient(clientId: String, clientSecret: String): [Record]!
        getForUserGeoBounded(clientId: String, clientSecret: String, bounds: Float, lat: Float, lng: Float): [Record]!
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
        },
        async getForUserGeoBounded(_, { clientId, clientSecret, bounds, lat, lng }: 
            { clientId: string, clientSecret: string, bounds: number, lat: number, lng: number }) {
            let results = await client
                .database("trackaboutphotos")
                .container("photo_metadata")
                .items.query({
                    query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.clientSecret = @clientSecret " +
                           "AND c.metadata.lat < @lat + @bounds AND c.metadata.lat > @lat - @bounds " +
                           "AND c.metadata.lng < @lng + @bounds AND c.metadata.lng > @lng - @bounds ",
                    parameters: [
                        {
                            name: "@clientId",
                            value: clientId
                        },
                        {
                            name: "@clientSecret",
                            value: clientSecret
                        },
                        {
                            name: "@bounds",
                            value: bounds
                        },
                        {
                            name: "@lat",
                            value: lat
                        },
                        {
                            name: "@lng",
                            value: lng
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