import { extension_settings, saveSettingsDebounced } from "../../../../script.js";
import { callGenericPopup, POPUP_TYPE } from '../../../popup.js';
import { getContext } from "../../../extensions.js";
import { hideChatMessageRange } from '../../../chats.js';

const extensionName = "hide-messages-plugin";
const defaultSettings = {
    basicN: 0,
    advancedX: -1,
    advancedY: -1
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    Object.assign(extension_settings[extensionName], defaultSettings);
}

function createMainPanel() {
    return `
    <div id="hide_plugin_panel" style="position: fixed; right: 20px; top: 200px; width: 150px; background: #f5f5f5; padding: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        <div class="hide-section">
            <h4 style="margin: 0 0 10px;">隐藏楼层</h4>
            <input type="number" id="basicN" placeholder="输入N" style="width: 100%; margin-bottom: 5px;">
            <div style="display: flex; gap: 5px;">
                <button id="advancedBtn" class="menu_button" style="flex: 1;">高级设置</button>
                <button id="basicSave" class="menu_button" style="flex: 1;">保存</button>
            </div>
        </div>
        <hr style="margin: 10px 0;">
        <button id="globalSave" class="menu_button" style="width: 100%;">保存当前设置</button>
    </div>`;
}

async function showAdvancedPopup() {
    const context = getContext();
    const M = context.chat.length - 1;
    const content = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center;">
        <label>起始楼层:</label>
        <input type="number" id="advancedX" value="${defaultSettings.advancedX}" placeholder="默认-1">
        <label>结束楼层:</label>
        <input type="number" id="advancedY" value="${M + 1}" placeholder="默认最新+1">
    </div>`;

    const result = await callGenericPopup(
        content,
        POPUP_TYPE.INPUT,
        "高级设置",
        { rows: 2 }
    );

    if (result) {
        extension_settings[extensionName].advancedX = parseInt(document.getElementById('advancedX').value) || -1;
        extension_settings[extensionName].advancedY = parseInt(document.getElementById('advancedY').value) || M + 1;
        saveSettingsDebounced();
    }
}

function applyHideRules() {
    const context = getContext();
    const M = context.chat.length - 1;
    const settings = extension_settings[extensionName];

    // 基础规则
    if (settings.basicN > 0) {
        const end = M - settings.basicN;
        if (end >= 0) {
            hideChatMessageRange(0, end, false);
        }
    }

    // 高级规则
    if (settings.advancedX >= 0 && settings.advancedY > settings.advancedX) {
        const start = settings.advancedX + 1;
        const end = settings.advancedY - 1;
        if (start <= end) {
            hideChatMessageRange(start, end, false);
        }
    }
}

jQuery(async () => {
    await loadSettings();
    
    // 创建UI面板
    $('body').append(createMainPanel());
    
    // 绑定事件
    $('#advancedBtn').on('click', showAdvancedPopup);
    
    $('#basicN').val(extension_settings[extensionName].basicN)
        .on('input', function() {
            const value = Math.max(0, parseInt($(this).val()) || 0); 
            extension_settings[extensionName].basicN = value;
            saveSettingsDebounced();
        });

    $('#globalSave').on('click', () => {
        applyHideRules();
        toastr.success('设置已应用并保存');
    });

    $('#basicSave').on('click', () => {
        applyHideRules();
        toastr.info('基础规则已应用');
    });
});
