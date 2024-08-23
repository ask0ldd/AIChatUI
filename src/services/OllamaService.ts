export class OllamaService{
    static async getModelList(){
        const url = "http://127.0.0.1:11434/api/tags"
        try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Response status: ${response.status}`);
            }
            const json = await response.json();
            return json
        } catch (error) {
            console.error(error);
        }
    }
}