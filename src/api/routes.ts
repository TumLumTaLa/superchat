export const APIRoutes = {
  GetPlaygroundAgents: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents`,
  AgentRun: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/{agent_id}/runs`,
  PlaygroundStatus: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/playground/status`,
  GetPlaygroundSessions: (PlaygroundApiUrl: string, agentId: string) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions`,
  GetPlaygroundSession: (
    PlaygroundApiUrl: string,
    agentId: string,
    sessionId: string
  ) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions/${sessionId}`,

  DeletePlaygroundSession: (
    PlaygroundApiUrl: string,
    agentId: string,
    sessionId: string
  ) =>
    `${PlaygroundApiUrl}/v1/playground/agents/${agentId}/sessions/${sessionId}`,

  GetPlayGroundTeams: (PlaygroundApiUrl: string) =>
    `${PlaygroundApiUrl}/v1/playground/teams`,
  TeamRun: (PlaygroundApiUrl: string, teamId: string) =>
    `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/runs`,
  GetPlaygroundTeamSessions: (PlaygroundApiUrl: string, teamId: string) =>
    `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/sessions`,
  GetPlaygroundTeamSession: (
    PlaygroundApiUrl: string,
    teamId: string,
    sessionId: string
  ) =>
    `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/sessions/${sessionId}`,
  DeletePlaygroundTeamSession: (
    PlaygroundApiUrl: string,
    teamId: string,
    sessionId: string
  ) => `${PlaygroundApiUrl}/v1/playground/teams/${teamId}/sessions/${sessionId}`,

  // LLM7.io API Routes
  LLM7ChatCompletions: () => 'https://api.llm7.io/v1/chat/completions',
  LLM7Models: () => 'https://api.llm7.io/v1/models'
}
