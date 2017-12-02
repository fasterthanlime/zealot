import * as Msgs from "../types/msgs";

export function leftPad(input: any, len: number, padding: string): string {
  let r = `${input}`;
  while (r.length < len) {
    r = `${padding}${r}`;
  }
  return r;
}

export function formatTicks(ticks: number): string {
  const seconds = ticks % 60;
  const minutes = Math.floor((ticks - seconds) / 60);

  return `${leftPad(minutes, 2, "0")}:${leftPad(seconds, 2, "0")}`;
}

export function pluralize(
  qt: number,
  singular: string,
  plural: string,
): string {
  if (qt === 0) {
    return `no ${plural}`;
  }
  if (qt === 1) {
    return `${qt} ${singular}`;
  }
  return `${qt} ${plural}`;
}

export function formatTeamMember(team: Msgs.Team): string {
  switch (team) {
    case Msgs.Team.Orion:
      return "child of orion";
    case Msgs.Team.Phoenix:
      return "child of the phoenix";
  }
}

export function formatCapitalTeam(team: Msgs.Team): string {
  switch (team) {
    case Msgs.Team.Orion:
      return "Orion";
    case Msgs.Team.Phoenix:
      return "Phoenix";
  }
}
