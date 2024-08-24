import { AIModel } from "../models/AIModel";

export class ChatService{
    
    /**
     * Asks a question to the AI model and returns the context and response.
     *
     * @param {string} question The question to ask the AI model.
     * @param {number[]} [context=[]] An optional array of numbers that serves as context for the question.
     * @returns {Promise<{context: number[], response: string}>} A promise resolving to an object with the context and response from the AI model.
     */
    static async askQuestion(question : string, context:number[] = []) : Promise<{context : number[], response : string}>
    {
        console.log('question : '+ question)
        const model = new AIModel({modelName : "llama3.1:8b"}).setTemperature(0.1).setContextSize(8000).setContext(context).setSystemPrompt("You are an helpful assistant.")
        const answer = (await model.ask(question))
        return {context : answer.context as number[], response : answer.response}
    }

    /**
     * Asks a question to the AI model and returns a ReadableStream of responses.
     *
     * @param {string} question The question to ask the AI model.
     * @param {number[]} [context=[]] An optional array of numbers that serves as context for the question.
     * @returns {Promise<ReadableStreamDefaultReader<Uint8Array>>} A promise resolving to a ReadableStream of responses from the AI model.
     */
    static async askQuestionStreaming(question : string, context:number[] = []) :  Promise<ReadableStreamDefaultReader<Uint8Array>>
    {
        console.log('question : '+ question)
        const model = new AIModel({modelName : "llama3.1:8b"}).setTemperature(0.1).enableStreaming().setContextSize(8000).setContext(context).setSystemPrompt("You are an helpful assistant.")
        return await model.askForAStreamedResponse(question)
    }
}