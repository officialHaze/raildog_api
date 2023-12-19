

export default class Generator {
  private static alphabets = ["a", "b", "c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
  private static integers = [0,1,2,3,4,5,6,7,8,9]
  public generateAPIKey(): string {
    // Generate a unique API key and return the result
    const set = [...Generator.alphabets, ...Generator.integers];
    const setLength = set.length;
    const apiKeyLength = 30 // Number of chars
    let apikey = "";
    let i = 0;
    while(i < apiKeyLength)
    {
      const randNum = Math.floor((Math.random() * (setLength-1)))
      console.log("Random num: ", randNum);
      const randChar = set[randNum];
      apikey += randChar.toString();
      i++
    }
    return apikey;
  }
}
