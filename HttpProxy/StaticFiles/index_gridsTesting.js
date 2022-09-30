"use strict";

let FILTERMODEL_FILTERTYPE_TEXT = "text";
let FILTERMODEL_FILTERTYPE_NUMBER = "number";
let FILTERMODEL_FILTERTYPE_DATE = "date";
let FILTERMODEL_FILTERTYPE_SET = "set";
let FILTERMODEL_TYPE_CONTAINS = "contains";
let FILTERMODEL_TYPE_NOT_CONTAINS = "notcontains";
let FILTERMODEL_TYPE_EQUALS = "equals";
let FILTERMODEL_TYPE_NOT_EQUAL = "notEqual";
let FILTERMODEL_TYPE_STARTS_WITH = "startswith";
let FILTERMODEL_TYPE_ENDS_WITH = "endswith";
let FILTERMODEL_TYPE_LESS_THAN = "lessThan";
let FILTERMODEL_TYPE_LESS_THAN_OR_EQUALS = "lessThanOrEqual";
let FILTERMODEL_TYPE_GREATER_THAN = "greaterThan";
let FILTERMODEL_TYPE_GREATER_THAN_OR_EQUALS = "greaterThanOrEqual";
let FILTERMODEL_TYPE_RANGE = "inRange";
let FILTERMODEL_TYPE_IS_NULL = "isNull";
let FILTERMODEL_TYPE_IS_NOT_NULL = "isNotNull";

let results = new Array(
    {
        reportName: "",
        columnName: "",
        propertyType: "",
        actualDataType: "",
        filterType: "",
        operation: "",
        sampleValue1: "",
        sampleValue2: "",
        matchResult: "",
        url: "",
        notes: ""
    });


async function myFunction() {

    let projectId = '3289f54a-2b62-4e27-bb77-e59836edc2bb';

    let reportNames = [
        "och",
        "csampprovisioning",
        "shelves",
        "networkelements",
        "equipment",
        "oms",
        "ccmd",
        "vp",
        "linkenggerrorsandwarnings",
        "equipmentGroup",
        "Sncs",
        "domain",
        "PhotonicSrlg",
        "CcmdLocProvisioning",
        "opsSncps",
        "photonicservices",
        "PassiveProvisioning",
        "photonicSncgs",
        "DwdmAdjacencies",
        "L0ControlPlane",
        "DifferentialProvisioning",
        "Ports",
        "PhotonicOsrp/links",
        "PhotonicOsrp/lines",
        "PhotonicOsrp/sncs",
        "PhotonicOsrp/sncps",
        "Dtl/paths",
        "Dtl/sets",
        "MediaChannel",
        "Dtl/txInfos",
        "fiberrunlistreport",
        "planningProjects/reports",
        "fibers/report"
    ];

    await ProcessReports(projectId, reportNames);

    console.log('Done ..');
}

async function ProcessReports(projectId, reportNames) {
    reportNames.forEach(async (reportName, index) => {
        await ProcessReport(projectId, reportName);
    });
}

async function ProcessReport(projectId, reportName) {
    if (reportName != "equipment") {
        return;
    }

    console.log(`Process Report: ${reportName}`);

    document.getElementById("demo").innerHTML = "Hello World <br>";
    let uriReportSchema = 'https://localhost/equipmenttopologyplanning/api/v1/Reports/schema?reportName=' + reportName;
    //console.log('Calling schema for ' + reportName);
    let reportSchema = await FetchReportSchema(projectId, uriReportSchema, reportName);

    let reportDataUriBase = GetReportDataUriBase(reportName, projectId);
    if (reportDataUriBase === null || reportDataUriBase === undefined) {
        console.log(`No URI defined for report ${reportName}`);
        return;
    }

    let reportingParamsNoFilter = '{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[],"sortModel":[],"pageSize":400,"pageNumber":1,"filterExpression":""}';
    let reportDataUriNoFilter = reportDataUriBase + '&reportingParams=' + reportingParamsNoFilter;

    // Fetch Report with no filters
    let gridDataNoFilter = await FetchGridData(reportDataUriNoFilter);
    if (gridDataNoFilter === null || gridDataNoFilter === undefined) {
        return;
    }


    //console.log('Checking properties for ' + reportName);
    for (let columnName in reportSchema.properties) {
        console.log(`Check column ${columnName}`);
        let prop = reportSchema.properties[columnName];
        let propertyType = prop.type; // Eg "string"
        let actualDataType;
        let precision;
        if (prop.hasOwnProperty("meta")) {
            if (prop.meta.properties.hasOwnProperty("actualDataType")) {
                actualDataType = prop.meta.properties.actualDataType; // Eg "date"
            }
            if (prop.meta.properties.hasOwnProperty("precision")) {
                precision = prop.meta.properties.precision; // But this is not required for verification - it will be required for equals, but for that we are verifying by its Text filter equivalent
            }
        }

        let resultTemplate = {
            reportName: reportName,
            columnName: columnName,
            propertyType: propertyType,
            actualDataType: actualDataType,
            filterType: "",
            operation: "",
            sampleValue1: "",
            sampleValue2: "",
            matchResult: "",
            url: "",
            notes: ""
        };

        // Case 1: type=integer or number
        // Call with Text Filter, then with Number Filter
        let filteredData = gridDataNoFilter.data.filter(p => p.hasOwnProperty(columnName) && p[columnName] !== null);

        if (filteredData !== undefined && filteredData.length > 0) {
            
            if ((propertyType === "integer" || propertyType === "number") 
                || (propertyType === "string" && actualDataType === "double")
                || (actualDataType === "date")) {


                let filterValue;
                let filterValue2;
                let operation;
                let filterType;

                let sampleValues = await GetSampleValuesFromGroupByData(reportDataUriBase, columnName, actualDataType);
                if (sampleValues === undefined || sampleValues === null) {
                    let resultNoResults = JSON.parse(JSON.stringify(resultTemplate));
                    resultNoResults.notes = "No Sample Values";
                    results.push(resultNoResults);
                    continue;
                }
                console.log(`sampleValues: ${JSON.stringify(sampleValues)}`);

                filterValue = sampleValues.sampleValue1; filterValue2 = sampleValues.sampleValue2;


                resultTemplate.sampleValue1 = sampleValues.sampleValue1;
                resultTemplate.sampleValue2 = sampleValues.sampleValue2;

                if (actualDataType === "date") {
                    // Date Filter

                    operation = FILTERMODEL_TYPE_EQUALS;
                    console.log(operation);                    
                    let result1 = JSON.parse(JSON.stringify(resultTemplate));
                    await CompareTextAndDateResults(columnName, propertyType, actualDataType, operation, filterValue, reportDataUriBase, reportName, result1);

                    operation = FILTERMODEL_TYPE_NOT_EQUAL;
                    console.log(operation);
                    let result2 = JSON.parse(JSON.stringify(resultTemplate));
                    await CompareTextAndDateResults(columnName, propertyType, actualDataType, operation, filterValue, reportDataUriBase, reportName, result2);

                    filterType = FILTERMODEL_FILTERTYPE_DATE;

                    // Other filters: isNull, isNotNull, <, > etc which do not have equivalent in Text filter
                    let result3 = JSON.parse(JSON.stringify(resultTemplate));
                    operation = await ValidateQueryResults(operation, columnName, propertyType, filterType, filterValue, filterValue2, reportDataUriBase, reportName, result3);
                }
                else {

                    // Number filter

                    operation = FILTERMODEL_TYPE_EQUALS;
                    console.log(operation);
                    let result1 = JSON.parse(JSON.stringify(resultTemplate));
                    await CompareTextAndNumberResults(columnName, propertyType, actualDataType, operation, filterValue, reportDataUriBase, reportName, result1);

                    operation = FILTERMODEL_TYPE_NOT_EQUAL;
                    console.log(operation);
                    let result2 = JSON.parse(JSON.stringify(resultTemplate));
                    await CompareTextAndNumberResults(columnName, propertyType, actualDataType, operation, filterValue, reportDataUriBase, reportName, result2);

                    filterType = FILTERMODEL_FILTERTYPE_NUMBER;

                    // Other filters: isNull, isNotNull, <, > etc which do not have equivalent in Text filter
                    let result3 = JSON.parse(JSON.stringify(resultTemplate));
                    operation = await ValidateQueryResults(operation, columnName, propertyType, filterType, filterValue, filterValue2, reportDataUriBase, reportName, result3);
                }

                console.log(results);
            }
        }

    }

    console.log('Done Checking properties for ' + reportName);
}

async function ValidateQueryResults(operation, columnName, propertyType, filterType, filterValue, filterValue2, reportDataUriBase, reportName, resultTemplate) {
    if (filterType === "number" || filterType === "date") {
        operation = FILTERMODEL_TYPE_IS_NULL;
        console.log(operation);

        let result1 = JSON.parse(JSON.stringify(resultTemplate));
        await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, result1);
        operation = FILTERMODEL_TYPE_IS_NOT_NULL;
        console.log(operation);
        let result2 = JSON.parse(JSON.stringify(resultTemplate));
        await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, result2);
        operation = FILTERMODEL_TYPE_LESS_THAN;
        console.log(operation);
        let result3 = JSON.parse(JSON.stringify(resultTemplate));
        await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, result3);
    }

    if (filterType === "number") {
        // <= is not implemented for Date
        operation = FILTERMODEL_TYPE_LESS_THAN_OR_EQUALS;
        console.log(operation);
        let result4 = JSON.parse(JSON.stringify(resultTemplate));
        await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, result4);
    }

    if (filterType === "number" || filterType === "date") {
        operation = FILTERMODEL_TYPE_GREATER_THAN;
        console.log(operation);
        let result5 = JSON.parse(JSON.stringify(resultTemplate));
        await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, result5);
    }


    if (filterType === "number") {
        // >= not implemented for Date
        operation = FILTERMODEL_TYPE_GREATER_THAN_OR_EQUALS;
        console.log(operation);
        let result6 = JSON.parse(JSON.stringify(resultTemplate));
        await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, result6);
    }

    if (filterType === "number" || filterType === "date") {
        if (filterValue2 !== undefined && filterValue2 !== "" && filterValue2 !== null) {
            let p1 = (filterValue < filterValue2) ? filterValue : filterValue2;
            let p2 = (filterValue < filterValue2) ? filterValue2 : filterValue;
            operation = FILTERMODEL_TYPE_RANGE;
            console.log(operation);
            let result7 = JSON.parse(JSON.stringify(resultTemplate));
            await ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, p1, p2, reportDataUriBase, reportName, result7);
        }
    }

    return operation;
}

async function GetSampleValuesFromGroupByData(reportDataUriBase, columnName, actualDataType) {
    let reportingParams = GetReportingParamsForGroupBy(columnName, new Array(columnName));
    let reportDataGroupByUri = reportDataUriBase + `&reportingParams=${reportingParams}`;

    let groupByData = await FetchGridData(reportDataGroupByUri);

    if (groupByData === undefined || groupByData === null) {
        return null;
    }

    let sampleValue1;
    let sampleValue2;

    if (groupByData.hasOwnProperty("data")) {
        if (groupByData.data.length > 0) {
            groupByData.data.every((item, index) =>
            {
                if (item !== undefined && item !== null && item !== "") {
                    if (sampleValue1 === undefined) {
                        let val = item[columnName];
                        if (val !== undefined && val !== null && val !== "") {
                            sampleValue1 = val;
                            if (actualDataType === "date") {
                                sampleValue1 = val.substring(0, 10); // Eg "2015-01-21T00:00:00.000000+00:00" to "2015-01-21"
                            }
                        }
                        return true;
                    }
                    if (sampleValue2 === undefined) {
                        let val = item[columnName];
                        if (val !== undefined && val !== null && val !== "") {
                            sampleValue2 = val;
                            if (actualDataType === "date") {
                                sampleValue2 = val.substring(0, 10); // Eg "2015-01-21T00:00:00.000000+00:00" to "2015-01-21"
                            }
                        }

                        return true;
                    }
                    if (sampleValue1 !== undefined && sampleValue2 !== undefined) {
                        let val = item[columnName];
                        if (val !== undefined && val !== null && val !== "") {
                            if (actualDataType === "date") {
                                val = val.substring(0, 10);
                            }
                            sampleValue1 = sampleValue2;
                            sampleValue2 = val;
                            return false;
                        }
                    }
                    return true;
                }
            });            
        }
    }

    return { sampleValue1, sampleValue2 };
}

function GetSampleValuesFromGridDataWithNoFilters(gridDataNoFilter, columnName) {
    let filterValue = gridDataNoFilter.data.filter(p => p[columnName] != null)[0][columnName];
    let filterValue2;

    let remainingData = gridDataNoFilter.data.filter(p => p[columnName] != null && p[columnName] != filterValue);
    if (remainingData !== undefined && remainingData.length > 0) {
        filterValue2 = remainingData[0][columnName];
    }
    if (filterValue2 !== undefined) {
        remainingData = remainingData.filter(p => p[columnName] != null && p[columnName] != filterValue2);
        let filterValue3;
        if (remainingData !== undefined && remainingData.length > 0) {
            filterValue3 = remainingData[0][columnName];
        }
        if (filterValue3 !== undefined) {
            filterValue = filterValue3;
        }
    }
    return { filterValue, filterValue2 };
}

function GetReportDataUriBase(reportName, projectId) {
    let server = "localhost"
    if (reportName === "equipment") {
        return `https://${server}/equipmenttopologyplanning/api/v1/Reports/equipment/${projectId}?useNetworkDescriptions=true`;
    }
    else if (reportName === "csampprovisioning") {
        return `https://${server}/equipmenttopologyplanning/api/v1/Reports/csampprovisioning/${projectId}?includePowerTable=true`;
    }

    return null;
}

async function ValidateNumberOrDateFilter(columnName, propertyType, filterType, operation, filterValue, filterValue2, reportDataUriBase, reportName, resultTemplate) {
    let reportingParamsNumberFilter = GetReportingParams(columnName, filterType, operation, filterValue, filterValue2);
    let reportDataUriNumberFilter = reportDataUriBase + '&reportingParams=' + reportingParamsNumberFilter;

    let result1 = JSON.parse(JSON.stringify(resultTemplate));

    try {
        let gridDataNumberFilter = await FetchGridData(reportDataUriNumberFilter);

        result1.filterType = filterType;
        result1.operation = operation;
        result1.url = reportDataUriNumberFilter;

        if (gridDataNumberFilter === null || gridDataNumberFilter === undefined || gridDataNumberFilter.data.length === 0) {
            console.log(`No rows: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
            result1.notes = "No rows";
            results.push(result1);
            return;
        }

        if (propertyType === "integer" || propertyType === "number" || filterType === "date") {
            let match = true;

            gridDataNumberFilter.data.every((item, index) => {
                if (item === undefined) {
                    console.log(`gridData item is undefined at index ${index}`);
                }

                let val = item[columnName];

                if (filterType === "date") {
                    val = val.substring(0, 10);
                }

                if (operation == FILTERMODEL_TYPE_IS_NOT_NULL) {
                    match = ValidateItemNotNull(reportName, columnName, propertyType, filterType, operation, filterValue, val, index);
                }
                else if (operation == FILTERMODEL_TYPE_IS_NULL) {
                    match = ValidateItemIsNull(reportName, columnName, propertyType, filterType, operation, filterValue, val, index);
                }
                else if (operation == FILTERMODEL_TYPE_LESS_THAN) {
                    match = ValidateItemIsLessThan(reportName, columnName, propertyType, filterType, operation, filterValue, val, index);
                }
                else if (operation == FILTERMODEL_TYPE_LESS_THAN_OR_EQUALS) {
                    match = ValidateItemIsLessThanOrEquals(reportName, columnName, propertyType, filterType, operation, filterValue, val, index);
                }
                else if (operation == FILTERMODEL_TYPE_GREATER_THAN) {
                    match = ValidateItemIsGreaterThan(reportName, columnName, propertyType, filterType, operation, filterValue, val, index);
                }
                else if (operation == FILTERMODEL_TYPE_GREATER_THAN_OR_EQUALS) {
                    match = ValidateItemIsGreaterThanOrEquals(reportName, columnName, propertyType, filterType, operation, filterValue, val, index);
                }
                else if (operation == FILTERMODEL_TYPE_RANGE) {
                    // "type":"inRange","filter":12,"filterTo":15
                    match = ValidateItemIsInRange(reportName, columnName, propertyType, filterType, operation, filterValue, filterValue2, val, index);
                }

                if (match === false) {
                    return false; // This breaks the loop
                }
            });

            if (match) {
                // Success
                //console.log(`Match! : reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
            }
            else {
                console.log(`Match Failed! : reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
            }
            result1.matchResult = match;
            results.push(result1);
        }

    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        result1.matchResult = "Exception";
        results.push(result1);
    }
}

function ValidateItemNotNull(reportName, columnName, propertyType, filterType, operation, filterValue, val, index) {
    try {
        console.log(columnName);
        if (val === undefined || val === "" || val === null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
            return false;
        }
        return true;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        throw ex;
    }
}

function ValidateItemIsNull(reportName, columnName, propertyType, filterType, operation, filterValue, val, index) {
    try {
        console.log(columnName);
        if (val !== undefined && val !== "" && val !== null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
            return false;
        }
        return true;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        throw ex;
    }
}

function ValidateItemIsLessThan(reportName, columnName, propertyType, filterType, operation, filterValue, val, index) {
    try {
        console.log(columnName);
        if (val === undefined || val === "" || val === null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
            return false;
        }
        if (val < filterValue) {
            return true;
        }

        console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
        return false;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        throw ex;
    }
}

function ValidateItemIsLessThanOrEquals(reportName, columnName, propertyType, filterType, operation, filterValue, val, index) {
    try {
        console.log(columnName);
        if (val === undefined || val === "" || val === null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
            return false;
        }
        if (val <= filterValue) {
            return true;
        }

        console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
        return false;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        throw ex;
    }
}

function ValidateItemIsGreaterThan(reportName, columnName, propertyType, filterType, operation, filterValue, val, index) {
    try {
        if (val === undefined || val === "" || val === null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
            return false;
        }
        if (val > filterValue) {
            return true;
        }

        console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
        return false;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        throw ex;
    }
}

function ValidateItemIsGreaterThanOrEquals(reportName, columnName, propertyType, filterType, operation, filterValue, val, index) {
    try {
        console.log(columnName);
        if (val === undefined || val === "" || val === null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
            return false;
        }
        if (val >= filterValue) {
            return true;
        }

        console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}, item ${val}, index ${index}`);
        return false;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterValue ${filterValue}`);
        console.log(ex);
        throw ex;
    }
}

function ValidateItemIsInRange(reportName, columnName, propertyType, filterType, operation, filterFromValue, filterToValue, val, index) {
    try {
        if (val === undefined || val === "" || val === null) {
            // Failure
            console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterFromValue ${filterFromValue}, filterToValue ${filterToValue}, item ${val}, index ${index}`);
            return false;
        }

        if (filterFromValue <= val && val <= filterToValue) {
            return true;
        }

        console.log(`Failed: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterFromValue ${filterFromValue}, filterToValue ${filterToValue}, item ${val}, index ${index}`);
        return false;
    }
    catch (ex) {
        console.log(`Exception: reportName ${reportName}, columnName ${columnName}, propertyType ${propertyType}, filterType ${filterType}, operation ${operation}, filterFromValue ${filterFromValue}, filterToValue ${filterToValue}, item ${val}, index ${index}`);
        console.log(ex);
        throw ex;
    }
}

async function CompareTextAndDateResults(columnName, propertyType, actualDataType, operation, filterValue, reportDataUriBase, reportName, resultTemplate) {
    let gridDataTextFilter;
    let gridDataDateFilter;
    let filterType = FILTERMODEL_FILTERTYPE_TEXT;
    let reportingParamsTextFilter = GetReportingParams(columnName, filterType, operation, filterValue, null);
    filterType = FILTERMODEL_FILTERTYPE_DATE;
    let reportingParamsDateFilter = GetReportingParams(columnName, filterType, operation, filterValue, null);
    let reportDataUriTextFilter = reportDataUriBase + '&reportingParams=' + reportingParamsTextFilter;
    let reportDataUriDateFilter = reportDataUriBase + '&reportingParams=' + reportingParamsDateFilter;

    let result1 = JSON.parse(JSON.stringify(resultTemplate));

    result1.filterType = filterType;
    result1.operation = operation;
    result1.url = reportDataUriDateFilter;

    if (actualDataType === "date") {
        // Fetch Grid Data with Text Filter                
        gridDataTextFilter = await FetchGridData(reportDataUriTextFilter);
        // Fetch Grid Data with Date Filter                
        gridDataDateFilter = await FetchGridData(reportDataUriDateFilter);
        if (gridDataTextFilter !== null && gridDataDateFilter !== null && gridDataTextFilter !== undefined && gridDataDateFilter !== undefined) {
            CompareGridData(gridDataTextFilter, gridDataDateFilter, reportName, columnName, propertyType, operation, filterValue, result1);
        }
    }
}

async function CompareTextAndNumberResults(columnName, propertyType, actualDataType, operation, filterValue, reportDataUriBase, reportName, resultTemplate) {
    let gridDataTextFilter;
    let gridDataNumberFilter;
    let filterType = FILTERMODEL_FILTERTYPE_TEXT;
    let reportingParamsTextFilter = GetReportingParams(columnName, filterType, operation, filterValue, null);
    filterType = FILTERMODEL_FILTERTYPE_NUMBER;
    let reportingParamsNumberFilter = GetReportingParams(columnName, filterType, operation, filterValue, null);
    let reportDataUriTextFilter = reportDataUriBase + '&reportingParams=' + reportingParamsTextFilter;
    let reportDataUriNumberFilter = reportDataUriBase + '&reportingParams=' + reportingParamsNumberFilter;

    let result1 = JSON.parse(JSON.stringify(resultTemplate));

    result1.filterType = filterType;
    result1.operation = operation;
    result1.url = reportDataUriNumberFilter;

    if ((propertyType === "integer" || propertyType === "number")
        || (propertyType === "string" && actualDataType === "double")) {
        // Fetch Grid Data with Text Filter                
        gridDataTextFilter = await FetchGridData(reportDataUriTextFilter);
        // Fetch Grid Data with Number Filter                
        gridDataNumberFilter = await FetchGridData(reportDataUriNumberFilter);
        if (gridDataTextFilter !== null && gridDataNumberFilter !== null && gridDataTextFilter !== undefined && gridDataNumberFilter !== undefined) {
            CompareGridData(gridDataTextFilter, gridDataNumberFilter, reportName, columnName, propertyType, operation, filterValue, result1);
        }
    }
}

function GetReportingParamsForGroupBy(columnName, rowGroupCols, groupKeys) {
    // Eg: {"startRow":0,"endRow":400,"rowGroupCols":["planningState_planningTimestamp"],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":["2015-02-24"],"filterModel":[],"sortModel":[{"column":"equipmentSpec_manufacturingDate","sort":"desc"}],"pageSize":400,"pageNumber":1,"filterExpression":""}

    if (groupKeys === undefined || groupKeys === null || groupKeys.length == 0) {
        return `{"startRow":0,"endRow":400,"rowGroupCols":${JSON.stringify(rowGroupCols)},"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[],"sortModel":[{"column":"${columnName}","sort":"asc"}],"pageSize":400,"pageNumber":1,"filterExpression":""}`;
    }
    return `{"startRow":0,"endRow":400,"rowGroupCols":${JSON.stringify(rowGroupCols)},"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":${groupKeys},"filterModel":[],"sortModel":[{"column":"${columnName}","sort":"asc"}],"pageSize":400,"pageNumber":1,"filterExpression":""}`;
}

function GetReportingParams(columnName, filterType, operation, filterValue, filterValue2) {

    if (filterType === "number" || filterType === "text") {
        if (operation === FILTERMODEL_TYPE_RANGE) {
            if (filterType === "text") {
                console.log(`Not expecting Range operation in text filter ${columnName}`);
                throw `Not expecting Range operation in text filter ${columnName}`;
            }

            return `{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[{"column":"${columnName}","key":"r1","filterType":"${filterType}","type":"${operation}","filter":"${filterValue}","filterTo":"${filterValue2}","values":["${filterValue}"]}],"sortModel":[],"pageSize":400,"pageNumber":1,"filterExpression":"( r1 )"}`;
        }

        // TODO : Same as above, if it works maybe we can just have 1 return in this block
        return `{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[{"column":"${columnName}","key":"r1","filterType":"${filterType}","type":"${operation}","filter":"${filterValue}","filterTo":"${filterValue2}","values":["${filterValue}"]}],"sortModel":[],"pageSize":400,"pageNumber":1,"filterExpression":"( r1 )"}`;

        //return '{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[{"column":"' + columnName + '","key":"r1","filterType":"' + filterType + '","type":"' + operation + '","filterTo":null,"values":[' + filterValue + ']}],"sortModel":[{"column":"' + columnName + '","sort":"asc"}],"pageSize":400,"pageNumber":1,"filterExpression":"( r1 )"}';
    }
    else if (filterType === "date") {
        if (operation === FILTERMODEL_TYPE_RANGE) {
            return `{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[{"column":"${columnName}","key":"r1","dateTo":"${filterValue2}","dateFrom":"${filterValue}","type":"${operation}","filterType":"${filterType}","values":["${filterValue}"]}],"sortModel":[{"column":"${columnName}","sort":"desc"}],"pageSize":400,"pageNumber":1,"filterExpression":"( r1 )"}`;
        }
        return `{"startRow":0,"endRow":400,"rowGroupCols":[],"valueCols":[],"pivotCols":[],"pivotMode":false,"groupKeys":[],"filterModel":[{"column":"${columnName}","key":"r1","dateTo":null,"dateFrom":"${filterValue}","type":"${operation}","filterType":"${filterType}","values":["${filterValue}"]}],"sortModel":[{"column":"${columnName}","sort":"desc"}],"pageSize":400,"pageNumber":1,"filterExpression":"( r1 )"}`;
    }
}

async function FetchReportSchema(projectId, uriReportSchema, reportName) {
    var response = await fetch(uriReportSchema, {
        headers: {
            'Content-Type': 'application/json',
        }
    });
    var data = await response.json();
    document.getElementById("demo").innerHTML += "[#] " + reportName + " - " + uriReportSchema + "<br>";
    let reportSchema = JSON.parse(data);
    //console.log(reportSchema);
    return reportSchema;
}

async function FetchGridData(reportDataUri) {
    try {
        var response = await fetch(reportDataUri, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        let gridData = await response.json();
        return gridData;
    }
    catch (ex) {
        console.log(`Exception: FetchGridData ${reportDataUri}`);
        console.log(ex);
        return null;
    }
}

function CompareGridData(gridDataA, gridDataB, reportName, columnName, propertyType, operation, filterValue, resultTemplate) {

    let result1 = JSON.parse(JSON.stringify(resultTemplate));

        if (JSON.stringify(gridDataA) === JSON.stringify(gridDataB)) {
            //console.log('Match ! Report: ' + reportName + ', column: ' + columnName + ', propertyType = ' + propertyType + ', operation = ' + operation + ', filterValue = ' + filterValue);
            result1.matchResult = true;
            results.push(result1);
        }
        else {
            console.log('Match Failed ! Report: ' + reportName + ', column: ' + columnName + ', propertyType = ' + propertyType + ', operation = ' + operation + ', filterValue = ' + filterValue);
            console.log(gridDataA);
            console.log(gridDataB);
            result1.matchResult = false;
            results.push(result1);
        }
    
}
