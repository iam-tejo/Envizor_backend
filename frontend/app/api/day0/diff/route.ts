import { NextResponse } from "next/server";

function names(list: any[] | undefined): string[] {
  if (!list) return [];
  return list.map(x => x.name).filter(Boolean);
}

function diffArrays(left: string[], right: string[]) {
  const onlyLeft = left.filter(x => !right.includes(x));
  const onlyRight = right.filter(x => !left.includes(x));
  const same = left.filter(x => right.includes(x));
  const different: string[] = []; // name-only mock → cannot detect content differences
  return { onlyLeft, onlyRight, same, different };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const left = searchParams.get("left");
  const right = searchParams.get("right");

  if (!left || !right) {
    return NextResponse.json({});
  }

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const leftData = await (await fetch(`${baseUrl}/api/day0/discovery?env=${left}`)).json();
  const rightData = await (await fetch(`${baseUrl}/api/day0/discovery?env=${right}`)).json();

  const result = {
    isMock: leftData.isMock || rightData.isMock || false,
    leftIsMock: leftData.isMock || false,
    rightIsMock: rightData.isMock || false,
    roles: diffArrays(names(leftData.roles), names(rightData.roles)),
    entitlements: diffArrays(names(leftData.entitlements), names(rightData.entitlements)),
    securitySystems: diffArrays(names(leftData.securitySystems), names(rightData.securitySystems)),
    endpoints: diffArrays(names(leftData.endpoints), names(rightData.endpoints)),
    connections: diffArrays(names(leftData.connections), names(rightData.connections)),
    tasks: diffArrays(names(leftData.tasks), names(rightData.tasks)),
    rules: diffArrays(names(leftData.rules), names(rightData.rules)),
  };

  return NextResponse.json(result);
}
