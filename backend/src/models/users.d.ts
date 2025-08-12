import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    googleId: string;
    email: string;
    name: string;
    profilePicture: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=users.d.ts.map