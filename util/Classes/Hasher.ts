import bcrypt from "bcrypt";

export default class Hasher {
  private saltRounds: number = 0;

  constructor(saltRounds: string | undefined) {
    if (!saltRounds) throw new Error("Hashing salt rounds not found!").message;
    this.saltRounds = parseInt(saltRounds);
  }

  public async generateHash(data: string | Buffer) {
    try {
      const hash = await bcrypt.hash(data, this.saltRounds);
      return hash;
    } catch (err) {
      throw err;
    }
  }

  public async compareHash(data: string | Buffer, hash: string) {
    try {
      const isValid = await bcrypt.compare(data, hash);
      return isValid;
    } catch (error) {
      throw error;
    }
  }
}
