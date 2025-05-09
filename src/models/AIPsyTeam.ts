/* eslint-disable @typescript-eslint/no-unused-vars */
import { AIAgent } from "./AIAgent.js";
import { answersSpectrumProducerPrompt, answerToAnswerComparisonPrompt, compareToPerfectAnswerPrompt, conversationistPrompt, jobExtractorPrompt, questionRatingViaScalePrompt, skillAssessementQuestionsSortingPrompt, skillsetGeneratorPrompt, skillToQuestionsPrompt } from "../prompts/AIPsyPrompts.ts";

export class AISkillsetGeneratorAgent extends AIAgent{
    
    /*#job : string | undefined = undefined

    setTargetJob(job : string){
        this.#job = job
    }*/

    override async rawCall(iter : number = 0) : Promise<string>{
        const currentIter = iter
        if(this.getRequest() == "") throw new Error("Request is missing.")
        const response = await this.getModel().ask(this.getRequest())
        this.getLog()(response.response)
        this.setLastOutput(response.response)
        if(this.getRegexValidator() == undefined) return response.response
        if(this.checkOutputValidity(response.response, this.getRegexValidator() as RegExp)) return response.response
        if(currentIter+1 < this.getMaxIter()) return this.rawCall(currentIter + 1)
        throw new Error(`Couldn't format the reponse the right way despite the ${this.getMaxIter()} iterations.`)
    }

    call = this.rawCall
}

export class AIPsyTeam{

    static jobExtractorAgent = new AIAgent({name : "Job Extractor Agent", modelName: 'qwen3:8b'}).resetContext().setTemperature(0.3).activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(jobExtractorPrompt)

    // !!! should mix own knowledge with whats found only?
    static requiredSkillsetGeneratorAgent = new AIAgent({name : "Skillset Generator", modelName: 'qwen3:8b'}).resetContext().activateDiscardThinking({startWith : "<think>", endWith : "</think>"}).setTemperature(0.6)
    .setSystemPrompt(skillsetGeneratorPrompt)

    static skillToQuestionsTranslatorAgent = new AIAgent({name : "Skill To Question Translator Agent", modelName: 'qwen3:8b'}).resetContext().setTemperature(0.6).activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(skillToQuestionsPrompt)

    static conversationistAgent = new AIAgent({name : "Conversationist", modelName: 'qwen3:8b'}).resetContext().activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(conversationistPrompt)

    /*static skillRankingAgent = new AIAgent("Skill Ranking Agent").resetContext()
    .setSystemPrompt(skillRankingPrompt)*/

    static skillAssessmentQuestionsRankingAgent = new AIAgent({name : "Skill Assessment Questions Ranking Agent", modelName: 'qwen3:8b'}).resetContext().activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(skillAssessementQuestionsSortingPrompt)

    static skillAssessmentQuestion_TenAnswersSpectrumProducerAgent = new AIAgent({name : "Itw Question Answers Spectrum Producer Agent", modelName: 'qwen3:8b'}).resetContext().setTemperature(0.6).activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(answersSpectrumProducerPrompt)

    static candidateAnswerRankingAgent = new AIAgent({name : "Candidate Answer Ranking Agent", modelName: 'qwen3:8b'}).resetContext().setTemperature(0.3).activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(questionRatingViaScalePrompt)

    static oneOnOneAnswersComparisonAgent = new AIAgent({name : "Answer to Answer Comparison Agent", modelName: 'qwen3:8b'}).resetContext().setTemperature(0.3).activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(answerToAnswerComparisonPrompt)

    static compareToPerfectAnswerAgent = new AIAgent({name : "Compare to Perfect Answer Agent", modelName: 'qwen3:8b'}).resetContext().setTemperature(0.3).activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    .setSystemPrompt(compareToPerfectAnswerPrompt)
}