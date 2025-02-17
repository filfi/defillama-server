import { cache20MinResponse, wrap, IResponse, errorResponse } from "./utils/shared";
import { getProtocolGas, getProtocolTxs, getProtocolUsers, getProtocolNewUsers, getLatestProtocolUsersData } from "./users/storeUsers";
import { getCurrentUnixTimestamp, getTimestampAtStartOfDay } from "./utils/date";

const typeInfo = {
    users: {
        query: getProtocolUsers,
        column: "users"
    },
    txs: {
        query: getProtocolTxs,
        column: "sum"
    },
    gas: {
        query: getProtocolGas,
        column: "sum"
    },
    newusers: {
        query: getProtocolNewUsers,
        column: "users"
    },
} as {[type:string]: {query:typeof getProtocolUsers, column:string}}

const handler = async (event: AWSLambda.APIGatewayEvent): Promise<IResponse> => {
    const protocolId = event.pathParameters?.protocolId?.toLowerCase().replace("$", "#") ?? "none";
    const type = event.pathParameters?.type?.toLowerCase();
    const selectedTypeInfo = typeInfo[type ?? '']
    if(selectedTypeInfo === undefined){
        return errorResponse({message: `Wrong type`})
    }
    const records = await selectedTypeInfo.query(protocolId)
    const latestRecords = (await getLatestProtocolUsersData(type as any, getCurrentUnixTimestamp()-8*3600, protocolId))
    if (latestRecords.length > 0) {
        const latestRecord = latestRecords.reduce((latest, record) => record.endtime > latest.endtime ? record : latest)
        const latestStart = getTimestampAtStartOfDay(latestRecord.endtime)
        if (latestStart > records[records.length - 1].start) {
            records.push({
                start: latestStart,
                [selectedTypeInfo.column]: latestRecord[selectedTypeInfo.column]
            })
        }
    }
    return cache20MinResponse(records.map((d)=>([d.start, d[selectedTypeInfo.column]])).sort((a,b)=>a[0]-b[0]))
}

export default wrap(handler);