import { Notification, CommentNotificationType, VoteNotificationType } from "../models/notification";
import { Comment } from "../models/comment";

export const NotificationTypeDef = `
  extend type Query {
    notifications: [Notification!]!
  }
  extend type Mutation {
    setNotificationsAsRead(notificationIds: [ID!]!): Boolean!
  }
  type Notification {
    id: ID!
    type: NotificationType!
    read: Boolean!
    post: Post
    comment: Comment
    updatedAt: Date!
  }
  enum NotificationType {
    ${CommentNotificationType.COMMENT_ON_OWNED_POST}
    ${VoteNotificationType.VOTE_ON_OWNED_POST}
    ${CommentNotificationType.COMMENT_ON_THIRD_PARTY_POST}
  }
`;

export const NotificationResolvers = {
  Query: {
    notifications: async(parent, args, context) => {
      return await Notification.find({ where: { receiver: { uid: context.user.uid }}, order: { updatedAt: 'DESC' }, relations: ['post', 'comment']});
    }
  },
  Notification: {
    read: (notification: Notification) => {
      return !!notification.readAt;
    }
  },
  Mutation: {
    setNotificationsAsRead: async(parent, args, context) => {
      throw new Error("not yet implemented");
    }
  }
};