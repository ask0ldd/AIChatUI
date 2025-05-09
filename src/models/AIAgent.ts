/* eslint-disable @typescript-eslint/no-unused-vars */
import IAIAgentPartialParams from "../types/IAIAgentPartialParams.js"
import TAgentReturnValue from "../types/TAgentReturnValue.js"
import { AIModel, IAIModelParams } from "./AIModel.js"

export class AIAgent extends AIModel {

    readonly #id : string
    #name : string
    #type : 'system' | 'user_created' = "user_created"
    #favorite : boolean = false
    #targetFilesNames : string[] = []
    #webSearchEconomy: boolean = false

    #maxIter = 5
    #request = ""
    #lastOutput : unknown = ""
    #regexValidator : RegExp | undefined
    #verifyParsability = false
    #responseParsingFn : ((llmResponse : string) => object) | undefined = undefined
    #observers : (AIAgent)[] = []
    #onUpdate?: (state: string, systemPrompt? : string) => Promise<TAgentReturnValue | void>

    models = ["phi3.5", "llama3", "llama3.1:8b", "dolphin-llama3:8b-256k", "phi3:3.8-mini-128k-instruct-q4_K_M", "qwen2", "qwen2:1.5b", "qwen2:0.5b", "gemma2:9b"]

    defaultModel = "qwen3:8b"

    /*constructor(name : string, model : string = "qwen3:8b"){
        this.#name = name
        this.#model = new AIModel({modelName : model})
            .setTemperature(0.1)
            .setContextSize(8000)
            .setContext([])
            .setSystemPrompt("You are an helpful assistant.")
            .activateDiscardThinking({startWith : "<think>", endWith : "</think>"})
    }*/

    constructor({
        id = "",
        name, 
        modelName = "llama3.1:8b", 
        systemPrompt = "You are an helpful assistant.", 
        temperature = 0.8, 
        mirostat = 0, 
        mirostat_eta = 0.1, 
        mirostat_tau = 5.0, 
        num_ctx = 2048,
        context = [],
        repeat_last_n = 64, 
        repeat_penalty = 1.1, 
        seed = 0,
        stop = ["\n", "user:", "AI assistant:"], 
        tfs_z = 1, 
        num_predict = 1024,
        top_k = 40,
        top_p = 0.9,
        type = "user_created",
        favorite = false,
        webSearchEconomy = false,
        min_p = 0.0,
        num_keep = 5,
        typical_p = 0.7,
        presence_penalty = 1.5,
        frequency_penalty = 1.0,
        penalize_newline = true,
        numa = false,
        num_batch = 2,
        num_gpu = 1,
        main_gpu = 0,
        low_vram = false,
        vocab_only = false,
        use_mmap = true,
        use_mlock = false,
        num_thread = 8,
        targetFilesNames = [],
        onUpdate = undefined,
    } : IAIModelParams & IAIAgentPartialParams)
    {
        super({
            modelName, 
            systemPrompt, 
            temperature,
            mirostat,
            mirostat_eta,
            mirostat_tau,
            context,
            num_ctx,
            repeat_last_n,
            repeat_penalty,
            seed,
            stop,
            tfs_z,
            num_predict,
            top_k,
            top_p,
            min_p,
            num_keep,
            typical_p,
            presence_penalty,
            frequency_penalty,
            penalize_newline,
            numa,
            num_batch,
            num_gpu,
            main_gpu,
            low_vram,
            vocab_only,
            use_mmap,
            use_mlock,
            num_thread,
        })
        this.#id = id
        this.#name = name
        this.#type = type
        this.#favorite = favorite
        this.#targetFilesNames = targetFilesNames
        this.#webSearchEconomy = webSearchEconomy
        return this
    }

    get model() : AIModel{
        return this.getModel()
    }

    async rawCall(iter : number = 0) : Promise<string>{
        const currentIter: number = iter
        console.log('\n\u001b[1;32m... In ' + (currentIter+1) + ' attempt.\n\n')
        if(this.#request == "") throw new Error("Request is missing.")
        const response = await this.ask(this.#request)
        this.#lastOutput = response.response
        // test response ability to be parsing
        if(this.#verifyParsability && !this.parsingCheck(response.response) && currentIter+1 < this.#maxIter) return this.rawCall(currentIter + 1)
        // test response formatting
        if(this.#regexValidator && !this.checkOutputValidity(response.response, this.#regexValidator as RegExp) && currentIter+1 < this.#maxIter) return this.rawCall(currentIter + 1)
        // if not formatted properly after all the iterations => throws
        if(currentIter+1 >= this.#maxIter) throw new Error(`Couldn't format the reponse the right way despite the ${this.#maxIter} iterations.`)
        return response.response
    }

    call = this.rawCall

    async parsedCall(iter : number = 0) : Promise<string | object>{
        if(this.#responseParsingFn == undefined) throw new Error("Parsing function is undefined")
        const currentIter: number = iter
        console.log('\n\u001b[1;32m... In ' + (currentIter+1) + ' attempt.\n\n')
        if(this.#request == "") throw new Error("Request is missing.")
        const response = await this.ask(this.#request)
        // this.#log(response.response)
        this.#lastOutput = this.#responseParsingFn(response.response)
        // test response ability to be parsing
        if(this.#verifyParsability && !this.parsingCheck(response.response) && currentIter+1 < this.#maxIter) return this.parsedCall(currentIter + 1)
        // test response formatting
        if(this.#regexValidator && !this.checkOutputValidity(response.response, this.#regexValidator as RegExp) && currentIter+1 < this.#maxIter) return this.parsedCall(currentIter + 1)
        // if not formatted properly after all the iterations => throws
        if(currentIter+1 >= this.#maxIter) throw new Error(`Couldn't format the reponse the right way despite the ${this.#maxIter} iterations.`)
        return this.#responseParsingFn(response.response)
    }

    checkOutputValidity(output : string, regex : RegExp) : boolean{
        return regex.test(output)
    }

    enableParsabilityCheck(): AIAgent{
        this.#verifyParsability = true
        return this
    }

    parsingCheck(jsonString : string): boolean{
        try {
            JSON.parse(jsonString);
            return true;  // Parsing succeeded
        } catch (error) {
            console.error(error)
            return false; // Parsing failed
        }
    }

    #log(text : string){
        console.log("\n\n\u001b[1;35m" + this.#name + ' :\n\u001b[1;36m' + text)
    }

    getId() : string {
        return this.#id
    }

    getName() : string{
        return this.#name
    }

    getWebSearchEconomy() : boolean {
        return this.#webSearchEconomy
    }

    getType() : 'system' | 'user_created' {
        return this.#type
    }

    getFavorite() : boolean {
        return this.#favorite
    }

    getTargetFilesNames() : string[]{
        return this.#targetFilesNames
    }

    setName(name : string) : AIAgent {
        this.#name = name
        return this
    }

    setWebSearchEconomy(webSearchEconomy: boolean) {
        this.#webSearchEconomy = webSearchEconomy
        return this
    }

    setType(type : string) {
        if(type!== 'system' && type!=='user_created') throw new Error('invalid type')
        this.#type = type
    }

    setFavorite(favorite : boolean){
        this.#favorite = favorite
    }

    setTargetFilesNames(filesnames : string[]) : AIAgent{
        this.#targetFilesNames = filesnames
        return this
    }

    asString(){
        return JSON.stringify(
            {
                id : this.getId(),
                name : this.#name,
                modelName: this.getModelName(),
                model: this.getModelName(),
                systemPrompt: this.getSystemPrompt(),
                num_ctx: this.getContextSize(),
                temperature: this.getTemperature(),
                num_predict: this.getNumPredict(),
                mirostat: this.getMirostat(),
                mirostat_eta: this.getMirostatEta(),
                mirostat_tau: this.getMirostatTau(),
                repeat_last_n: this.getRepeatLastN(),
                repeat_penalty: this.getRepeatPenalty(),
                seed: this.getSeed(),
                stop: this.getStop(),
                tfs_z: this.getTfsZ(),
                top_k: this.getTopK(),
                top_p: this.getTopP(),
                type: this.getType(),
                favorite: this.getFavorite()
            }
        )
    }

    onUpdate(callback : (state: string) => Promise<TAgentReturnValue | void >){
        /*const boundCallback = (state : string) => {
            return callback.call(this, state)
        }*/
        this.#onUpdate = callback //boundCallback
    }

    toObject(){
        return({
            id : this.getId(),
            name : this.#name,
            modelName: this.getModelName(),
            systemPrompt: this.getSystemPrompt(),
            num_ctx: this.getContextSize(),
            temperature: this.getTemperature(),
            num_predict: this.getNumPredict(),
            mirostat: this.getMirostat(),
            mirostat_eta: this.getMirostatEta(),
            mirostat_tau: this.getMirostatTau(),
            repeat_last_n: this.getRepeatLastN(),
            repeat_penalty: this.getRepeatPenalty(),
            seed: this.getSeed(),
            stop: this.getStop(),
            tfs_z: this.getTfsZ(),
            top_k: this.getTopK(),
            top_p: this.getTopP(),
            type: this.getType(),
            favorite: this.getFavorite()
        })
    }
    
    clone() : AIAgent{
        return new AIAgent({
            id : this.getId(),
            name : this.#name,
            modelName: this.getModelName(),
            systemPrompt: this.getSystemPrompt(),
            num_ctx: this.getContextSize(),
            temperature: this.getTemperature(),
            num_predict: this.getNumPredict(),
            mirostat: this.getMirostat(),
            mirostat_eta: this.getMirostatEta(),
            mirostat_tau: this.getMirostatTau(),
            repeat_last_n: this.getRepeatLastN(),
            repeat_penalty: this.getRepeatPenalty(),
            seed: this.getSeed(),
            stop: this.getStop(),
            tfs_z: this.getTfsZ(),
            top_k: this.getTopK(),
            top_p: this.getTopP(),
            type: this.getType(),
            favorite: this.getFavorite(),
            min_p: this.getMinP(),
            num_keep: this.getNumKeep(),
            typical_p: this.getTypicalP(),
            presence_penalty: this.getPresencePenalty(),
            frequency_penalty: this.getFrequencyPenalty(),
            penalize_newline: this.getPenalizeNewline(),
            numa: this.getNuma(),
            num_batch: this.getNumBatch(),
            num_gpu: this.getNumGpu(),
            main_gpu: this.getMainGpu(),
            low_vram: this.getLowVram(),
            vocab_only: this.getVocabOnly(),
            use_mmap: this.getUseMmap(),
            use_mlock: this.getUseMlock(),
            num_thread: this.getNumThread(),
        })
       // return Object.create(this)
    }

    // Observer methods / observer[0] -> AIAgent, observer[1] -> ProgressTracker
    async update(response: string): Promise<TAgentReturnValue | void> {
        try {
            let result: TAgentReturnValue | void
    
            // if the onUpdate callback has been defined, use it
            if (this.#onUpdate) {
                result = await this.#onUpdate(response)
            } else {
                // if not, LLM.ask
                result = await this.defaultAskLLMCallback(response)
            }
    
            if (result && this.#observers.length > 0) {
                return await this.notifyObservers(result)
            }
    
            return result
        } catch (error) {
            console.error(`Error when trying to update the agent ${this.#name} :`, error)
        }
    }

    async defaultAskLLMCallback(query : string) : Promise<TAgentReturnValue | void>{
        try{
            const response = await this.ask(query)
            // if there is no observer listening to this agent (last agent of the chain)
            // if(this.#observers.length < 1) return response
            // if there is at least an observer
            // return await this.notifyObservers(response)
            return response
        }catch(error){
            console.error('Error while trying to communicate with the model : ', error)
            throw error
        }
    }

    addObserver(observer : AIAgent) {
        this.#observers.push(observer);
    }

    getObservers(){
        return this.#observers
    }

    // notify the next agent in the chain
    // & the chainProgressTracker
    async notifyObservers(response : TAgentReturnValue) : Promise<TAgentReturnValue | void> {
        /*this.#observers.forEach(observer => {
            if(observer instanceof ProgressTracker) observer.update(response)
        })*/
        for(const observer of this.#observers){
            // if(observer instanceof Mediator) return observer.update((typeof(response) === "object" && 'response' in response) ? {sourceNode : this.#name, data : response.response} : {sourceNode : this.#name, data : response})
            if(observer instanceof AIAgent) return observer.update((typeof(response) === "object" && 'response' in response) ? response.response : response)
        }
        return undefined
    }

    setRequest(request : string) : AIAgent{
        this.#request = request
        return this
    }

    resetContext(): AIAgent{
        this.setContext([])
        return this
    }

    setMaxIter(iter : number) : AIAgent{
        this.#maxIter = iter
        return this
    }

    setRegexOutputValidator(regex : RegExp): AIAgent{
        this.#regexValidator = regex
        return this
    }

    getRequest() : string{
        return this.#request
    }

    getModel() : AIModel{
        return this.getModel()
    }

    getLog() : (text : string) => void {
        return this.#log
    }

    getMaxIter() : number{
        return this.#maxIter
    }

    getLastOutput() : unknown{
        return this.#lastOutput
    }

    getRegexValidator() : RegExp | undefined{
        return this.#regexValidator
    }

    setLastOutput(lastOutput : string) : void{
        this.#lastOutput = lastOutput
    }

    setReplyParsingFn(parsingFn : (llmResponse : string) => object){
        this.#responseParsingFn = parsingFn
        return this
    }

    //setAction
    //setOutputSchema
}

// should be able to link a control agent

export interface IAIAgentParams{
    name : string
    model : AIModel
}

/*
Agent Attributes
Attribute	Description
Role	Defines the agent's function within the crew. It determines the kind of tasks the agent is best suited for.
Goal	The individual objective that the agent aims to achieve. It guides the agent's decision-making process.
Backstory	Provides context to the agent's role and goal, enriching the interaction and collaboration dynamics.
LLM (optional)	Represents the language model that will run the agent. It dynamically fetches the model name from the OPENAI_MODEL_NAME environment variable, defaulting to "gpt-4" if not specified.
Tools (optional)	Set of capabilities or functions that the agent can use to perform tasks. Expected to be instances of custom classes compatible with the agent's execution environment. Tools are initialized with a default value of an empty list.
Function Calling LLM (optional)	Specifies the language model that will handle the tool calling for this agent, overriding the crew function calling LLM if passed. Default is None.
Max Iter (optional)	The maximum number of iterations the agent can perform before being forced to give its best answer. Default is 25.
Max RPM (optional)	The maximum number of requests per minute the agent can perform to avoid rate limits. It's optional and can be left unspecified, with a default value of None.
max_execution_time (optional)	Maximum execution time for an agent to execute a task It's optional and can be left unspecified, with a default value of None, menaning no max execution time
Verbose (optional)	Setting this to True configures the internal logger to provide detailed execution logs, aiding in debugging and monitoring. Default is False.
Allow Delegation (optional)	Agents can delegate tasks or questions to one another, ensuring that each task is handled by the most suitable agent. Default is True.
Step Callback (optional)	A function that is called after each step of the agent. This can be used to log the agent's actions or to perform other operations. It will overwrite the crew step_callback.
Cache (optional)	Indicates if the agent should use a cache for tool usage. Default is True.
*/