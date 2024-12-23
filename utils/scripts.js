import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import log from "./logger.js";

// API URL
const apiUrl = "https://pro-api.animix.tech";

// Yêu cầu với số lần thử lại sử dụng proxy
async function requestWithRetry(endpoint, options, retries = 3, proxy = null) {
    const url = `${apiUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const requestOptions = {
        ...options,
        signal: controller.signal,
    };

    if (proxy) {
        requestOptions.agent = new HttpsProxyAgent(proxy);
    }

    try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Lỗi HTTP! mã trạng thái: ${response.status}`);
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (retries > 0) {
            log.warn(`Thử lại yêu cầu tới ${url}. Số lần thử còn lại: ${retries}`);
            return await requestWithRetry(endpoint, options, retries - 1, proxy);
        }
        log.error(`Yêu cầu tới ${url} đã thất bại sau 3 lần thử:`, error);
        return null;
    }
};

// Lấy danh sách nhiệm vụ
export async function fetchMissionList(headers, proxy) {
    const data = await requestWithRetry("/public/mission/list", { method: "GET", headers }, 3, proxy);
    return data?.result || [];
}

// Lấy thông tin người dùng
export async function fetchUserInfo(headers, proxy) {
    const data = await requestWithRetry("/public/user/info", { method: "GET", headers }, 3, proxy);
    return data || {};
}

// Lấy tất cả các thành tựu
export async function fetchAllAchievements(headers, proxy) {
    const data = await requestWithRetry("/public/achievement/list", { method: "GET", headers }, 3, proxy);
    const allAchievements = Object.values(data?.result || {})
        .flatMap(quest => quest.achievements)
        .filter(quest => quest.status === true && quest.claimed === false)
        .map(quest => quest.quest_id);
    return allAchievements;
}

// Lấy danh sách thú
export async function fetchPetList(headers, proxy) {
    const data = await requestWithRetry("/public/pet/list", { method: "GET", headers }, 3, proxy);
    const petIdsByStarAndClass = {};
    const allPetIds = [];

    for (const pet of data.result || []) {
        if (!petIdsByStarAndClass[pet.star]) petIdsByStarAndClass[pet.star] = {};
        if (!petIdsByStarAndClass[pet.star][pet.class]) petIdsByStarAndClass[pet.star][pet.class] = [];

        const petAmount = parseInt(pet.amount, 10);

        for (let i = 0; i < petAmount; i++) {
            petIdsByStarAndClass[pet.star][pet.class].push(pet.pet_id);
            allPetIds.push(pet.pet_id);
        }
    }

    return { petIdsByStarAndClass, allPetIds };
}

// Lấy danh sách DNA thú
export async function fetchPetDnaList(headers, proxy) {
    const data = await requestWithRetry("/public/pet/dna/list", { method: "GET", headers }, 3, proxy);
    const momPetIds = [];
    const dadPetIds = [];
    const allPetIds = [];

    for (const pet of data.result || []) {
        const petAmount = parseInt(pet.amount, 10);
        for (let i = 0; i < petAmount; i++) {
            allPetIds.push(pet.item_id);
            if (pet.can_mom) {
                momPetIds.push(pet.item_id);
            } else {
                dadPetIds.push(pet.item_id);
            }
        }
    }

    return { momPetIds, dadPetIds, allPetIds };
}

// Lấy danh sách nhiệm vụ hàng ngày
export async function fetchQuestList(headers, proxy) {
    const data = await requestWithRetry("/public/quest/list", { method: "GET", headers }, 3, proxy);
    return data?.result?.quests
        .filter(quest => quest.status === false)
        .map(quest => quest.quest_code) || [];
}

// Lấy danh sách Season Pass
export async function fetchSeasonPass(headers, proxy) {
    const data = await requestWithRetry("/public/season-pass/list", { method: "GET", headers }, 3, proxy);
    return data?.result || [];
}

// Nhận Season Pass
export async function claimSeasonPass(headers, proxy, seasonId, type, step) {
    const payload = { season_id: seasonId, type, step };
    const data = await requestWithRetry("/public/season-pass/claim", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    }, 3, proxy);
    if (data?.result) {
        log.info("Đã nhận Season Pass thành công:", data.result);
    }
}

// Nhận nhiệm vụ
export async function claimMission(headers, proxy, missionId) {
    const payload = { mission_id: missionId };
    const data = await requestWithRetry("/public/mission/claim", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    }, 3, proxy);
    if (data?.result) {
        log.info("Đã nhận nhiệm vụ thành công:", data.result);
    }
}

// Pha trộn thú
export async function indehoy(headers, proxy, mom, dad) {
    const payload = { dad_id: dad, mom_id: mom };
    const data = await requestWithRetry("/public/pet/mix", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    }, 3, proxy);
    const pet = data?.result?.pet || { name: "Không rõ", star: 0, class: "Không rõ" };
    const petInfo = { name: pet.name, star: pet.star, class: pet.class };
    log.info(`Đã pha trộn thú thành công!😘 Sinh ra:`, JSON.stringify(petInfo));
}

// Tham gia nhiệm vụ
export async function joinMission(headers, proxy, payloadMission) {
    const data = await requestWithRetry("/public/mission/enter", {
        method: "POST",
        headers,
        body: JSON.stringify(payloadMission),
    }, 3, proxy);
    if (data?.result?.createdAt) {
        log.info("Đã tham gia nhiệm vụ thành công lúc:", data.result.createdAt);
    }
}

// Tham gia clan
export async function joinClan(headers, proxy) {
    const data = await requestWithRetry("/public/clan/join", {
        method: "POST",
        headers,
        body: JSON.stringify({ clan_id: 97 }),
    }, 3, proxy);
    if (data?.result) {
        log.info("Đã tham gia clan thành công:", data.result);
    }
}

// Kiểm tra nhiệm vụ
export async function checkIn(headers, proxy, questCode) {
    const data = await requestWithRetry("/public/quest/check", {
        method: "POST",
        headers,
        body: JSON.stringify({ quest_code: questCode }),
    }, 3, proxy);
    if (data?.result?.status) {
        log.info(`Đã nhận nhiệm vụ ${questCode} thành công:`, data.result.status);
    }
}

// Nhận thành tựu
export async function claimAchievement(headers, proxy, questId) {
    const data = await requestWithRetry("/public/achievement/claim", {
        method: "POST",
        headers,
        body: JSON.stringify({ quest_id: questId }),
    }, 3, proxy);
    if (data?.result?.status) {
        log.info(`Đã nhận thành tựu ${questId} thành công:`, data.result.status);
    }
}

// Nhận thú mới
export async function getNewPet(headers, proxy) {
    const data = await requestWithRetry("/public/pet/dna/gacha", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount: 1 }),
    }, 3, proxy);
    const pet = data?.result?.dna[0] || { name: "Không rõ", star: 0, class: "Không rõ" };
    const petInfo = { name: pet.name, star: pet.star, class: pet.class };
    const godPower = data?.result?.god_power || 0;
    log.info("Nhận thú mới thành công!", JSON.stringify(petInfo));
    return godPower;
}
