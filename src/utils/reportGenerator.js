import { formatRocDate } from './helpers';

export const getTransportText = (depTime, depTrans, depTransCustom, retTime, retTrans, retTransCustom, indent = '   ') => {
    let transportText = '';
    const symbol = indent.length >= 5 ? '•' : '-';
    if (depTime || depTrans) {
        let depStr = depTrans || '';
        if (depStr.includes('其它') && depTransCustom) {
            depStr = depStr.replace('其它', `其它(${depTransCustom})`);
        }
        transportText += `${indent}${symbol} 出發：${depTime || '??:??'} ${depStr}\n`;
    }
    if (retTime || retTrans) {
        let retStr = retTrans || '';
        if (retStr.includes('其它') && retTransCustom) {
            retStr = retStr.replace('其它', `其它(${retTransCustom})`);
        }
        transportText += `${indent}${symbol} 返程：${retTime || '??:??'} ${retStr}\n`;
    }
    return transportText;
};

export const formatBasicReport = (formData, dateInfo) => {
    const loc = formData.location === '其它' ? formData.locationCustom : formData.location;
    let text = `【親子成長聯絡簿】\n\n📅 日期：${formatRocDate(formData.date)} ${formData.time}\n`;
    
    let wParts = [];
    if (formData.weather) wParts.push(formData.weather);
    if (formData.weatherTempMin || formData.weatherTempMax) wParts.push(`${formData.weatherTempMin || '?'}°C ~ ${formData.weatherTempMax || '?'}°C`);
    if (formData.weatherLocation) wParts.push(`(${formData.weatherLocation})`);
    if (wParts.length > 0) text += `🌤️ 天氣：${wParts.join(' ')}\n`;

    const handoverStr = formData.handoverSituation === '其它' ? `${formData.handoverSituation} (${formData.handoverSituationCustom})` : formData.handoverSituation;
    if (handoverStr) text += `🤝 交接：${handoverStr}\n`; 
    if (loc) text += `📍 地點：${loc}\n`;
    if (formData.handoverItems) text += `🎒 物品：${formData.handoverItems}\n`;
    if (formData.isOvernight) {
        text += `🌙 過夜：${formData.isOvernight}${formData.isOvernight === '是' ? ` 【${formatRocDate(formData.overnightStartDate || formData.date)} ~ ${formatRocDate(formData.overnightEndDate || formData.date)}】` : ''}\n`;
    }
    
    const basicTransport = getTransportText(formData.departureTripTime, formData.departureTripTransportation, formData.departureTripTransportationCustom, formData.returnTripTime, formData.returnTripTransportation, formData.returnTripTransportationCustom, '   ');
    if (basicTransport) {
        text += `🚗 交通方式：\n${basicTransport}`;
    }

    formData.childArrivalRecordsBasic?.forEach(r => { const aloc = r.location === '其它' ? r.locationCustom : r.location; if (r.time || aloc) text += `🏠 小孩已於 ${r.time || '??:??'} 抵達 ${aloc || '???'}\n`; });
    
    return text.trimEnd();
};

export const formatSchoolReport = (formData) => {
    let schoolText = '';
    if (formData.schoolLeaveType) {
        let lt = formData.schoolLeaveType;
        if (lt === '其它') lt += ` (${formData.schoolLeaveOther})`;
        else if (lt === '半天') lt += ` (${formData.schoolLeaveHalfDayDesc})`;
        else if (lt === '事假') lt += ` (${formData.schoolLeavePersonalDesc})`;
        else if (lt === '病假') lt += ` (${formData.schoolLeaveSickDesc})`;
        schoolText += `   - 假別：${lt}\n`;
    }
    if (formData.schoolNotes) schoolText += `   - 校方的話：${formData.schoolNotes}\n`;
    if (formData.schoolArrivalTime) schoolText += `   - 到校：${formData.schoolArrivalTime} ${formData.schoolArrivalCompanion ? `(${formData.schoolArrivalCompanion})` : ''}\n`;
    if (formData.schoolDepartureTime) schoolText += `   - 放學：${formData.schoolDepartureTime} ${formData.schoolDepartureCompanion ? `(${formData.schoolDepartureCompanion})` : ''}\n`;
    
    const schoolTransport = getTransportText(formData.schoolDepartureTripTime, formData.schoolDepartureTripTransportation, formData.schoolDepartureTripTransportationCustom, formData.schoolReturnTripTime, formData.schoolReturnTripTransportation, formData.schoolReturnTripTransportationCustom, '     ');
    if (schoolTransport) {
        schoolText += `   - 🚗 交通方式：\n${schoolTransport}`;
    }

    formData.childArrivalRecordsSchool?.forEach(r => { const aloc = r.location === '其它' ? r.locationCustom : r.location; if (r.time || aloc) schoolText += `   - 🏠 小孩已於 ${r.time || '??:??'} 抵達 ${aloc || '???'}\n`; });

    return schoolText ? `🏫 學校接送資訊：\n${schoolText.trimEnd()}` : '';
};

export const formatActivityReport = (formData) => {
    let activityText = '';
    if (formData.activityRecords && formData.activityRecords.length > 0) { formData.activityRecords.forEach(a => { activityText += `   • ${a.time ? `${a.time} ` : ''}${a.location ? `在${a.location} ` : ''}${a.content ? `進行 ${a.content}` : ''} ${a.type ? `(${a.type})` : ''}\n`; }); }
    
    if (formData.activityRecords?.some(a => a.type === '戶外')) {
        const activityTransport = getTransportText(formData.activityDepartureTripTime, formData.activityDepartureTripTransportation, formData.activityDepartureTripTransportationCustom, formData.activityReturnTripTime, formData.activityReturnTripTransportation, formData.activityReturnTripTransportationCustom, '     ');
        if (activityTransport) {
            activityText += `   • 🚗 交通方式：\n${activityTransport}`;
        }
        formData.childArrivalRecordsActivity?.forEach(r => { const aloc = r.location === '其它' ? r.locationCustom : r.location; if (r.time || aloc) activityText += `   • 🏠 小孩已於 ${r.time || '??:??'} 抵達 ${aloc || '???'}\n`; });
    }

    return activityText ? `🐾 活動記錄：\n${activityText.trimEnd()}` : '';
};

export const formatDiningReport = (formData) => {
    let diningText = '';
    const formatMeal = (name, time, content, appetite, water, isRefer) => {
        if (!content && !time && !appetite && !water && !isRefer) return '';
        let c = content; if (isRefer) c = c ? `${c} (參考學校聯絡簿)` : "(參考學校聯絡簿)";
        let details = []; if(appetite) details.push(`食慾:${appetite}`); if(water) details.push(`水:${water}`);
        let detailStr = details.length ? ` (${details.join(', ')})` : '';
        return `   - ${name}：${time ? `(${time}) ` : ''}${c}${detailStr}\n`;
    };
    diningText += formatMeal('早餐', formData.mealBreakfastTime, formData.mealBreakfast, formData.appetiteBreakfast, formData.waterBreakfast);
    diningText += formatMeal('午餐', formData.mealLunchTime, formData.mealLunch, formData.appetiteLunch, formData.waterLunch, formData.lunchReferToSchool);
    diningText += formatMeal('晚餐', formData.mealDinnerTime, formData.mealDinner, formData.appetiteDinner, formData.waterDinner);
    if (formData.snackReferToSchool) diningText += `   - 點心：(參考學校聯絡簿)\n`;
    formData.snackRecords.forEach(s => diningText += formatMeal('點心', s.time, s.content, s.appetite, s.water));

    return diningText ? `🍽  用餐與飲水：\n${diningText.trimEnd()}` : '';
};

export const formatSleepReport = (formData) => {
    let sleepText = '';
    if (formData.sleepLastNight) sleepText += `   - 昨晚就寢：${formData.sleepLastNight}\n`;
    formData.sleepAwakeRecords.forEach(r => sleepText += `     • 夜醒 ${r.time}${r.asleepTime ? ` ~ ${r.asleepTime}` : ''} : ${r.reason}${r.isBreastfeeding ? " (親餵)" : ""}\n`);
    if (formData.sleepWakeUp) sleepText += `   - 早上起床：${formData.sleepWakeUp} ${formData.isWakeUpBreastfeeding ? '(親餵)' : ''}\n`;
    
    let napHeader = `   - 午休、小睡：`; if (formData.napReferToSchool) napHeader += ` (參考學校聯絡簿)`; 
    if (formData.napRecords.length > 0 || formData.napReferToSchool) {
        sleepText += `${napHeader}\n`;
        formData.napRecords.forEach(n => { const typeLabel = n.isNap ? '小睡' : '午休'; sleepText += `     • ${typeLabel} ${n.startTime} ~ ${n.endTime}${n.isNotAsleep ? ` (沒睡著: ${n.reason})` : ''}\n`; });
    }
    if (formData.sleepBedtime) sleepText += `   - 晚上就寢：${formData.sleepBedtime} ${formData.isBedtimeBreastfeeding ? '(親餵)' : ''}\n`;
    if (formData.sleepActualTime) sleepText += `     • 實際入睡：${formData.sleepActualTime} ${formData.sleepActualReason ? `(${formData.sleepActualReason})` : ''}\n`;

    let finalStr = sleepText ? `💤 睡眠狀況：\n${sleepText.trimEnd()}` : '';
    
    if (formData.breastfeedingTimes.length > 0) {
        const bfStr = `🤱 親餵哺乳：${formData.breastfeedingTimes.map(t => `${t.time}${t.isNap ? '(小睡)' : ''}`).join('、')}`;
        finalStr = finalStr ? `${finalStr}\n${bfStr}` : bfStr;
    }

    return finalStr;
};

export const formatPhysiologyReport = (formData) => {
    let text = '';
    let bowelText = '';
    if (formData.bowelReferToSchool) bowelText += '   (參考學校聯絡簿)\n';
    if (formData.isNoBowelMovement) bowelText += `   - 本日無排便\n`;
    formData.bowelMovements.forEach((bm, i) => bowelText += `   (${i + 1}) ${bm.time} - ${bm.type}\n`);
    if (bowelText) text += `💩 排便記錄：\n${bowelText.trimEnd()}`;
    
    let emotionText = '';
    if (formData.emotionRecords.length > 0) { formData.emotionRecords.forEach(r => emotionText += `   • ${r.time} ${r.mood} ${r.note ? `(${r.note})` : ''}\n`); }
    if (emotionText) text += `${text ? '\n\n-------------------\n' : ''}😊 情緒與行為：\n${emotionText.trimEnd()}`;
    
    return text;
};

export const formatHealthReport = (formData) => {
    let healthText = '';
    if (formData.healthCardStatus) { const statusMap = { 'dad_to_mom': '爸爸交給媽媽', 'mom_to_dad': '媽媽交給爸爸', 'card_at_dad': '卡片在爸爸這', 'card_at_mom': '卡片在媽媽這' }; healthText += `🪪 健保卡：${statusMap[formData.healthCardStatus] || ''}\n`; }
    if (formData.oralCareRecords.length > 0 || formData.oralCareReferToSchool) { healthText += `   - 口腔保健：${formData.oralCareReferToSchool ? ' (參考學校聯絡簿)' : ''}\n`; formData.oralCareRecords.forEach(r => healthText += `     • ${r.time} ${r.type}\n`); }

    if (formData.symptoms.length > 0) { 
        healthText += `   - 不適症狀：\n`; 
        formData.symptoms.forEach(i => { 
            let details = []; if(i.isFever) details.push(`發燒 ${i.feverTemp || '?'}°C${i.isFeverMedication ? ' (已服藥)' : ''}`); if(i.isDoctorVisited) details.push('已就醫'); if(i.isMedicated) details.push('已服藥');
            let detailStr = details.length ? ` (${details.join('、')})` : '';
            let obs = []; if(i.observationTime) obs.push(`觀察:${i.observationTime}`); if(i.isImproved) obs.push('改善'); if(i.isNotImproved) obs.push(`未改善${i.notImprovedReason ? `(${i.notImprovedReason})` : ''}`);
            let obsStr = obs.length ? ` [${obs.join(' ')}]` : '';
            healthText += `     • ${i.isPreviousDay?'(前一天)':''} ${i.time} ${i.desc}${detailStr}${obsStr}\n`; 
        }); 
    }
    if (formData.injuryRecords?.length > 0) { 
        healthText += `   - 受傷記錄：\n`; 
        formData.injuryRecords.forEach(i => { 
            let info = []; 
            if (i.isPreviousDay) info.push('(前一天)');
            if(i.time) info.push(i.time); 
            if(i.location) info.push(`@${i.location}`);
            let content = []; if(i.part) content.push(`部位:${i.part}`); if(i.cause) content.push(`原因:${i.cause}`);
            let actions = []; if(i.isMedicated) actions.push('已擦藥'); if(i.isDoctorVisited) actions.push('已就醫');
            let actionStr = actions.length ? ` (${actions.join('、')})` : '';
            healthText += `     • ${info.join(' ')} ${content.join('，')}${actionStr}\n`; 
        }); 
    }
    if (formData.medications.length > 0) { 
        healthText += `   - 用藥紀錄：\n`; 
        formData.medications.forEach(m => { 
            let type = []; if(m.isInternal) type.push('內服'); if(m.isExternal) type.push('外用');
            let typeStr = type.length ? `(${type.join('/')})` : '';
            let obs = []; if(m.isImproved) push('改善'); if(m.isNotImproved) obs.push(`未改善${m.notImprovedReason ? `(${m.notImprovedReason})` : ''}`);
            let obsStr = obs.length ? ` [${obs.join(' ')}]` : '';
            healthText += `     • ${m.isPreviousDay?'(前一天)':''} ${m.time} ${typeStr} ${m.name} ${obsStr}\n`; 
        }); 
    }
    if (formData.medicalLocations.length > 0) { 
        healthText += `   - 就醫資訊：\n`; 
        formData.medicalLocations.forEach(i => { 
            let treatments = []; if(i.isVaccine) treatments.push(`疫苗:${i.vaccineName}`); if(i.isInjection) treatments.push('打針'); if(i.isIV) treatments.push('點滴'); if(i.isOtherTreatment) treatments.push(`其它:${i.otherTreatmentDesc}`);
            let treatStr = treatments.length ? ` -> ${treatments.join('、')}` : '';
            let reason = i.reason ? ` (${i.reason})` : ''; let note = i.doctorNote ? ` 醫囑:${i.doctorNote}` : ''; let cost = i.cost ? ` $${i.cost}元` : '';
            let followUpDateStr = i.followUpDate ? formatRocDate(i.followUpDate).split(' ')[0] : '未定';
            let followUp = i.isFollowUp ? ` [預約回診: ${followUpDateStr}${i.followUpNumber ? ` (${i.followUpNumber}號)` : ''}]` : '';
            healthText += `     • ${i.time} ${i.desc}${reason}${treatStr}${note}${cost}${followUp}\n`; 
        }); 
    }
    if (formData.healthCheckRecords.length > 0) { 
        healthText += `   - 健康檢查：\n`; 
        formData.healthCheckRecords.forEach(c => { 
            healthText += `     • ${c.time} ${c.checkLocation}\n`; 
            if(c.height || c.weight) healthText += `       數值: 身高${c.height}cm / 體重${c.weight}kg\n`;
            if(c.isVaccine) healthText += `       疫苗: ${c.vaccineName}\n`;
            let eye = []; if(c.leftEyeStatus) eye.push(`左眼:${c.leftEyeStatus==='normal'?'正常':`異常(${c.leftEyeAbnormalReason})`}`); if(c.rightEyeStatus) eye.push(`右眼:${c.rightEyeStatus==='normal'?'正常':`異常(${c.rightEyeAbnormalReason})`}`);
            if(eye.length) healthText += `       視力: ${eye.join(' / ')}\n`;
            let oral = []; if(c.oralStatus) oral.push(`檢查:${c.oralStatus==='normal'?'正常':`異常(${c.oralAbnormalReason})`}`); if(c.isOralCare) oral.push(`保健:${c.oralCareItem}`);
            if(oral.length) healthText += `       牙齒: ${oral.join(' / ')}\n`;
            if(c.cost) healthText += `       費用: $${c.cost}元\n`;
            if(c.doctorNote) healthText += `       醫囑: ${c.doctorNote}\n`;
        }); 
    }

    return healthText ? `💊 健康與醫療：\n${healthText.trimEnd()}` : '';
};

export const formatFooterReport = (formData) => {
    let footerText = '';
    if (formData.notes) footerText += `📝 備註：${formData.notes || ''}\n`;
    if (formData.recorder) footerText += `✍ 記錄人：${formData.recorder || ''}`;
    return footerText.trimEnd();
};

export const generateReportText = (formData, dateInfo) => {
    const sections = [
        formatBasicReport(formData, dateInfo),
        formatSchoolReport(formData),
        formatSleepReport(formData),
        formatDiningReport(formData),
        formatPhysiologyReport(formData),
        formatHealthReport(formData),
        formatActivityReport(formData)
    ].filter(Boolean);

    let report = sections.join('\n-------------------\n');
    
    const footer = formatFooterReport(formData);
    if (footer) {
        report += `\n-------------------\n${footer}`;
    }
    
    return report;
};
