const { buildSchema } = require('graphql');

module.exports = buildSchema(`

	type Post {
		_id: ID!
		title: String!
		content: String!
		imageUrl: String!
		creator: User!
		createdAt: String!
		updatedAt: String!
	}

	type User {
		_id: ID!
		name: String!
		email: String!
		password: String
		status: String!
		posts: [Post!]!
		resetToken: String
		resetTokenExpiration: String
	}

	input SignupData {
		name: String!
		email: String!
		password: String!
	}

	type RootQuery {
		hello: String!
	}

	type RootMutation {
		createUser(userInput: SignupData): User!
	}

	schema {
		query: RootQuery
		mutation: RootMutation
	}
`);