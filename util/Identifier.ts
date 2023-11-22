export default class Indentifier {
  public static uniqueId() {
    let id = "";
    let i = 0;
    while (i < 11) {
      const rand = Math.floor(Math.random() * 10);
      id += rand.toString();
      i++;
    }
    return id;
  }
}
