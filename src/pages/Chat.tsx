/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import ChatHistory from "../components/ChatHistory";
import { AIPsyTeam } from "../models/AIPsyTeam";

function Chat() {

    const techLeadPrompt = "Tech Lead in a the company's department dealing with the frontend of a social media plateform"
    const dataScientistPrompt = "Data Scientist in charge of analyzing NASDAQ trends"
    const walmartCashierPrompt = "Walmart Cashier"
    const hotelRepectionistPrompt = "Hotel Receptionist in a luxury hotel"

    // memo : when trying to retrieve async value, need useState + useEffect
    const [jobDisambiguation, setJobDisambiguation] = useState("")
    const [requiredSkillset, setRequiredSkillset] = useState("")
    useEffect(() => {
        const fetchJobDisambiguation = async () => {
            const hotelReceptionistPrompt = "Hotel Receptionist in a luxury hotel"
            try {
                const jobExtractorResult = await AIPsyTeam.jobExtractorAgent
                    .setRequest(hotelReceptionistPrompt)
                    .call()
                console.log(jobExtractorResult)
                setJobDisambiguation(jobExtractorResult)

                const skillsetGeneratorResult = await AIPsyTeam.requiredSkillsetGeneratorAgent.enableParsabilityCheck()
                    .setRequest(JSON.parse(jobExtractorResult).jobTitle)
                    .call()
                console.log(skillsetGeneratorResult)
                setRequiredSkillset(skillsetGeneratorResult)
            } catch (error) {
                console.error("Error fetching job disambiguation:", error)
            }
        }
        fetchJobDisambiguation()
    }, [])

    return (
        <>
            {JSON.parse(jobDisambiguation).jobTitle}<br/>
            {requiredSkillset}
            <ChatHistory>
            </ChatHistory>
        </>
      );
}
  
  export default Chat