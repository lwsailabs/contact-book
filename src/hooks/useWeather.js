import { useCallback } from 'react';
import { ACTIONS } from '../constants/config';

let openccConverter = null;
const toTraditionalAsync = async (str) => {
    if (!str) return str;
    try {
        if (!window.OpenCC) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '[https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js](https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/full.js)';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        if (!openccConverter) {
            openccConverter = window.OpenCC.Converter({ from: 'cn', to: 'tw' });
        }
        return openccConverter(str);
    } catch (e) {
        console.warn("繁簡轉換套件載入失敗，回退至原字串", e);
        return str; 
    }
};

export const useWeather = (date, dispatch, showToast) => {
    return useCallback(async (searchQuery = '') => {
        const fetchWeather = async (lat, lon, fallbackName = '') => {
            try {
              const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`);
              const data = await res.json();
              
              let locationName = fallbackName;
              try {
                  const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-TW`);
                  const geoData = await geoRes.json();
                  if (geoData && geoData.address) {
                      const city = geoData.address.city || geoData.address.county || geoData.address.town || '';
                      const district = geoData.address.suburb || geoData.address.city_district || geoData.address.village || geoData.address.neighbourhood || '';
                      if (city || district) {
                          const rawName = city === district ? city : `${city}${district}`;
                          locationName = await toTraditionalAsync(rawName); 
                      }
                  }
              } catch (e) { console.error("Geo fetch failed", e); }
              
              if (data.daily?.temperature_2m_max) {
                 dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'weatherTempMax', value: data.daily.temperature_2m_max[0] } });
                 dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'weatherTempMin', value: data.daily.temperature_2m_min[0] } });
                 if (locationName) dispatch({ type: ACTIONS.UPDATE_FIELD, payload: { name: 'weatherLocation', value: locationName } });
                 showToast('氣溫資料已更新', 'success');
              } else showToast("查無該日期的氣溫資料", 'error');
            } catch (error) { showToast("氣象資料取得失敗", 'error'); }
        };

        if (typeof searchQuery === 'string' && searchQuery.trim()) {
            showToast('搜尋地點中...', 'info');
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=zh-TW`);
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                    const lat = geoData[0].lat;
                    const lon = geoData[0].lon;
                    const traditionalQuery = await toTraditionalAsync(searchQuery.trim());
                    fetchWeather(lat, lon, traditionalQuery); 
                } else {
                    showToast('找不到該地點，請嘗試其他關鍵字', 'error');
                }
            } catch (e) {
                showToast('地點搜尋失敗', 'error');
            }
            return;
        }

        if (!navigator.geolocation) { showToast("無定位功能，使用臺北市松山區", 'info'); fetchWeather(25.058, 121.558, '臺北市松山區'); return; }
        navigator.geolocation.getCurrentPosition(p => fetchWeather(p.coords.latitude, p.coords.longitude), 
            () => { showToast("無法定位，使用臺北市松山區", 'info'); fetchWeather(25.058, 121.558, '臺北市松山區'); }, { timeout: 5000 });
    }, [date, dispatch, showToast]);
};