import { ISkill } from '../../types/ISkill'
import './SkillsetDisplayRow.css'

function SkillsetDisplayRow({skill} : {skill : ISkill}) {
  return (
    <tr className={skill.id % 2 == 0 ? "greyBackground" : ""}>
        <td className='skill'>{skill.id}</td><td>{skill.name}</td><td>{skill.description}</td>
    </tr>
  )
}

export default SkillsetDisplayRow