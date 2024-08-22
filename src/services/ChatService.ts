import { AIModel } from "../models/AIModel";

export class ChatService{
    
    static async askQuestion(question : string) : Promise<string>{
        /*const answer = await AIPsyTeam.conversationistAgent
                    .setRequest(question)
                    .call()
        return answer*/
        console.log('question : '+ question)
        const model = new AIModel({modelName : "llama3.1:8b"}).setTemperature(0.1).setContextSize(8000).setContext([]).setSystemPrompt("You are an helpful assistant.")
        return (await model.ask(question)).response
    }
}