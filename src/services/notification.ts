import { Comment } from "../models/comment";
import { CommentNotificationType, Notification, VoteNotificationType } from "../models/notification";
import { Post } from "../models/post";
import Expo from 'expo-server-sdk';
import { Profile } from "../models/profile";
import { EntityManager } from "typeorm";
import { ProfileVotePost } from "../models/profile-vote-post";
import { ProfileFollowPost } from "../models/profile-follow-post";

const expo = new Expo();

export class NotificationService {
	static notifyNewComent = async(comment: Comment, entityManager: EntityManager) => {
		const post = await entityManager.findOne(Post, comment.postId);

		const receiver = await entityManager.findOne(Profile, post.ownerUid);
		const sender = await entityManager.findOne(Profile, comment.ownerUid);

		await entityManager.insert(Notification, Notification.create({ comment, post, receiver, type: CommentNotificationType.COMMENT_ON_OWNED_POST }));
		
		if (receiver.expoPushToken) await NotificationService.sendExpoNotifications({
			body: `${sender.username} commented your post.`,
			data: {
				type: CommentNotificationType.COMMENT_ON_OWNED_POST,
				postId: post.id
			}
		}, [receiver.expoPushToken]);
	}

	static notifyVoteActivity = async(vote: ProfileVotePost, entityManager: EntityManager) => {
		const post = await entityManager.findOne(Post, vote.postId);
		const receiver = await entityManager.findOne(Profile, post.ownerUid);
		const voteCount = await entityManager.count(ProfileVotePost, { where: { post: post }});
		const notification = await entityManager.findOne(Notification, { where: { type: VoteNotificationType.VOTE_ON_OWNED_POST, post: post }});

		if (notification) {
			await entityManager.update(Notification, { id: notification.id }, { readAt: null });
		} else {
			await entityManager.insert(Notification, Notification.create({ post, receiver, type: VoteNotificationType.VOTE_ON_OWNED_POST }));
		}
	
		if (receiver.expoPushToken) await NotificationService.sendExpoNotifications({
			body: `${voteCount} people voted on your post.`,
			data: {
				type: VoteNotificationType,
				postId: post.id
			}
		}, [receiver.expoPushToken]);
	}

	static notifyNewCommentFollowers = async (comment: Comment, entityManager: EntityManager) => {
		const post = await entityManager.findOne(Post, comment.postId);
		
		await Promise.all(post.postFollowers.map(async profile => {
			const receiver = await entityManager.findOne(Profile, profile);
			const sender = await entityManager.findOne(Profile, comment.ownerUid);

			const postOwner = await entityManager.findOne(Profile, post.ownerUid);

			await entityManager.insert(Notification, Notification.create({ comment, post, receiver, type: CommentNotificationType.COMMENT_ON_THIRD_PARTY_POST }));

			if (receiver.expoPushToken) await NotificationService.sendExpoNotifications({
				body: `${sender.username} commented on ${postOwner.username}'s post`,
				data: {
					type: CommentNotificationType.COMMENT_ON_THIRD_PARTY_POST,
					postId: post.id
				}
			}, [receiver.expoPushToken]);
		}));
	
	}

	private static sendExpoNotifications = async(message: NotificationMessage, tokens: string[]) => {
		let messages = [];

		for (let pushToken of tokens) {
			if (!Expo.isExpoPushToken(pushToken)) {
				console.error(`Push token ${pushToken} is not a valid Expo push token`);
				continue;
			}

			// Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
			messages.push({
				...message,
				to: pushToken
			});
		}

		let chunks = expo.chunkPushNotifications(messages);
		let tickets = [];

		// Send the chunks to the Expo push notification service. There are
		// different strategies you could use. A simple one is to send one chunk at a
		// time, which nicely spreads the load out over time:
		for (let chunk of chunks) {
			try {
				let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
				tickets.push(...ticketChunk);
				// NOTE: If a ticket contains an error code in ticket.details.error, you
				// must handle it appropriately. The error codes are listed in the Expo
				// documentation:
				// https://docs.expo.io/versions/latest/guides/push-notifications#response-format
			} catch (error) {
				console.error(error);
			}
		}
	}
}

export declare type NotificationMessage = {
	data?: Object;
	title?: string;
	body?: string;
	sound?: 'default' | null;
	ttl?: number;
	expiration?: number;
	priority?: 'default' | 'normal' | 'high';
	badge?: number;
};