"""Job description parser."""
import re
from models.schemas import ParsedJDResponse, JDData

class JDParserService:

    async def parse(self, jd_text: str) -> ParsedJDResponse:
        """Extract structured info from JD text using regex heuristics."""
        # Extract title
        title_match = re.search(r'(position|role|title|job title)[:\s]+(.+)', jd_text, re.IGNORECASE)
        title = title_match.group(2).strip() if title_match else None

        # Skills extraction
        skills_section = re.search(
            r'(required\s+skills?|must\s+have|requirements?)[:\s]+(.*?)(?=nice\s+to\s+have|preferred|$)',
            jd_text, re.IGNORECASE | re.DOTALL
        )
        required_skills = []
        if skills_section:
            skills_text = skills_section.group(2)
            required_skills = [s.strip() for s in re.split(r'[,\n•\-]', skills_text) if s.strip() and len(s.strip()) > 1]

        # Nice to have
        nice_section = re.search(r'(nice\s+to\s+have|preferred|bonus)[:\s]+(.*?)(?=\n\n|$)', jd_text, re.IGNORECASE | re.DOTALL)
        nice_skills = []
        if nice_section:
            nice_text = nice_section.group(2)
            nice_skills = [s.strip() for s in re.split(r'[,\n•\-]', nice_text) if s.strip() and len(s.strip()) > 1]

        # Experience
        exp_match = re.search(r'(\d+)[\+\s]*[-–to]*\s*(\d+)?\s*years?', jd_text, re.IGNORECASE)
        min_exp = float(exp_match.group(1)) if exp_match else None
        max_exp = float(exp_match.group(2)) if exp_match and exp_match.group(2) else None

        return ParsedJDResponse(
            jd=JDData(
                title=title,
                required_skills=required_skills[:20],
                nice_to_have_skills=nice_skills[:10],
                min_experience=min_exp,
                max_experience=max_exp,
                description=jd_text[:500],
            )
        )
