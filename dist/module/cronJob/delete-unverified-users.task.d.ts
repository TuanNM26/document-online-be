import { Model } from 'mongoose';
import { UserDocument } from '../../module/user/user.schema';
export declare class DeleteUnverifiedUsersTask {
    private userModel;
    private readonly logger;
    constructor(userModel: Model<UserDocument>);
    handleCron(): Promise<void>;
}
