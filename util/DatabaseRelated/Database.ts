import mongoose from "mongoose";
import Admin from "./Models/Admin";
import UserData from "../Interfaces/UserData";
import masterAdminData from "../../masterAdminData";
import User from "./Models/User";
import AdminData from "../Interfaces/AdminData";

export default class DB {
  public async connect() {
    try {
      const mongoURI = process.env.MONGO_DB_URI;
      if (!mongoURI) throw new Error("Mongo connection string not found!").message;

      // If mongo conenction exists continue
      await mongoose.connect(mongoURI);
      console.log("Connected to MongoDB");

      // Check if master admin exists
      const isMAPresent = await this.doesMasterAdminExist();
      if (isMAPresent) console.log("Master admin exists!");
      else {
        // Create the initial master admin
        await this.createMasterAdmin();
      }
    } catch (err) {
      throw err;
    }
  }

  public async doesMasterAdminExist() {
    try {
      const masterAdmin = await Admin.findOne({ level: "master" });

      if (!masterAdmin) return false;

      return true;
    } catch (err) {
      throw err;
    }
  }

  public async createMasterAdmin() {
    try {
      // To create master admin, first the user needs to be created
      // Create the user
      console.log("Creating initial user for master admin...");
      const userData: UserData = masterAdminData;
      const user = new User(userData);
      const newuser = await user.save();

      console.log("User created!");
      console.log(newuser);

      // Create the master admin
      const admin: AdminData = {
        level: "master",
        user_id: newuser._id,
      };
      console.log("Creating master admin...");
      const masterAdmin = new Admin(admin);
      const newMasterAdmin = await masterAdmin.save();

      console.log("Master admin created!");
      console.log(newMasterAdmin);
    } catch (err) {
      throw err;
    }
  }

  public async createUser(userData: UserData) {
    try {
      const newUser = new User({
        ...userData,
        is_verified: false,
      });
      const savedUser = await newUser.save();
      console.log("User created!", savedUser);
      return savedUser;
    } catch (err) {
      throw err;
    }
  }

  public static async verifyUser(uid: mongoose.Types.ObjectId) {
    try {
      const updatedUser = await User.findByIdAndUpdate(uid, { is_verified: true }, { new: true });
      console.log("User verified: ", updatedUser);
    } catch (error) {
      throw error;
    }
  }
}
