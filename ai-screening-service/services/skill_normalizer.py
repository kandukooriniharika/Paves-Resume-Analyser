"""Lightweight skill normalization — maps common aliases to canonical names."""

SKILL_ALIASES: dict[str, str] = {
    # JavaScript ecosystem
    "reactjs": "REACT", "react.js": "REACT", "react js": "REACT",
    "vuejs": "VUE", "vue.js": "VUE",
    "angularjs": "ANGULAR", "angular.js": "ANGULAR",
    "nodejs": "NODE.JS", "node js": "NODE.JS", "node": "NODE.JS",
    "expressjs": "EXPRESS", "express.js": "EXPRESS",
    "nextjs": "NEXT.JS", "next js": "NEXT.JS",
    "nestjs": "NEST.JS", "nest js": "NEST.JS",
    # Python
    "fastapi": "FASTAPI", "fast api": "FASTAPI",
    "django rest framework": "DRF", "drf": "DRF",
    "scikit learn": "SCIKIT-LEARN", "sklearn": "SCIKIT-LEARN",
    # Java
    "springboot": "SPRING BOOT", "spring-boot": "SPRING BOOT",
    "spring mvc": "SPRING MVC",
    # Databases
    "postgres": "POSTGRESQL", "pg": "POSTGRESQL",
    "mongo": "MONGODB", "mongo db": "MONGODB",
    "mssql": "SQL SERVER", "ms sql": "SQL SERVER",
    "mysql": "MYSQL",
    "redis": "REDIS",
    "elastic": "ELASTICSEARCH", "es": "ELASTICSEARCH",
    # Cloud
    "aws": "AWS", "amazon web services": "AWS",
    "gcp": "GCP", "google cloud": "GCP",
    "azure": "AZURE", "microsoft azure": "AZURE",
    # DevOps
    "k8s": "KUBERNETES", "kube": "KUBERNETES",
    "docker": "DOCKER",
    "ci cd": "CI/CD", "cicd": "CI/CD",
    "github actions": "GITHUB ACTIONS",
    # AI / ML
    "machine learning": "ML", "deep learning": "DL",
    "natural language processing": "NLP",
    "large language model": "LLM", "llm": "LLM",
    "tensorflow": "TENSORFLOW", "tf": "TENSORFLOW",
    "pytorch": "PYTORCH",
    "langchain": "LANGCHAIN",
    # Other
    "typescript": "TYPESCRIPT", "ts": "TYPESCRIPT",
    "javascript": "JAVASCRIPT", "js": "JAVASCRIPT",
    "rest api": "REST", "restful": "REST",
    "graphql": "GRAPHQL",
    "git": "GIT",
}


def normalize(skill: str) -> str:
    """Return the canonical name for a skill string."""
    key = skill.strip().lower()
    return SKILL_ALIASES.get(key, skill.strip().upper())


def normalize_list(skills: list[str]) -> list[str]:
    """Normalize a list of skills, deduplicating after normalization."""
    seen: set[str] = set()
    result: list[str] = []
    for s in skills:
        norm = normalize(s)
        if norm not in seen:
            seen.add(norm)
            result.append(norm)
    return result
