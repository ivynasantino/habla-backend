import { Entity, BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn } from "typeorm";
import { Profile } from "./profile";
import { Comment } from "./comment";
import { Post } from "./post";

@Entity()
export class Notification extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ nullable: false })
    type: CommentNotificationType | VoteNotificationType; // add other types later

    @Column({ nullable: true })
    commentId: number;

    @ManyToOne(type => Comment, comment => comment.notifications, { onDelete: 'CASCADE' })
    comment: Comment;

    @Column({ nullable: true })
    postId: number;

    @ManyToOne(type => Post, post => post.notifications, { onDelete: 'CASCADE' })
    post: Post;

    @ManyToOne(type => Profile, profile => profile.notifications, { onDelete: 'CASCADE' })
    receiver: Profile;

    @Column({ type: "timestamp with time zone", nullable: true })
    readAt: Date;

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt: Date;
}

export enum CommentNotificationType {
    COMMENT_ON_OWNED_POST = 'COMMENT_ON_OWNED_POST',
    COMMENT_ON_THIRD_PARTY_POST = 'COMMENT_ON_THIRD_PARTY_POST'
}

export enum VoteNotificationType {
    VOTE_ON_OWNED_POST = 'VOTE_ON_OWNED_POST'
}