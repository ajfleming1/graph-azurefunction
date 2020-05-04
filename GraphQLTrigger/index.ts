import { ApolloServer, gql } from "apollo-server-azure-functions";
import { CosmosClient } from "@azure/cosmos";
const client = new CosmosClient(process.env.CosmosKey);
const typeDefs = gql`
    type Record {
        id: ID
        userId: String
        base64: String!
    }

    type Query {
        getForUser(userId: String): [Record]!
    }
`;

const resolvers = {
    Query: {
        async getForUser(_, { userId }: { userId: string }) {
            let results = await client
                .database("linkylinkdb")
                .container("linkbundles")
                .items.query({
                    query: "SELECT * FROM c WHERE c.userId = @userId",
                    parameters: [
                        {
                            name: "@userId",
                            value: userId
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