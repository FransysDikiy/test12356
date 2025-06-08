#include <application.h>

#define BUZZER_GPIO TWR_GPIO_P17
#define BUTTON_GPIO TWR_GPIO_BUTTON

char reminderId[64] = "";
twr_button_t button;
uint64_t deviceId;
twr_radio_sub_t radio_subs[1];

void pub_string(const char *suffix_topic, const char *value) {
    char topic[64];
    snprintf(topic, sizeof(topic), "device/%llx/%s", deviceId, suffix_topic);
    twr_radio_pub_string(topic, value);
}

void set_buzzer_is_buzzing(bool isBuzzing) {
    twr_gpio_set_output(BUZZER_GPIO, !isBuzzing);
}

void button_event_handler(twr_button_t *self, twr_button_event_t event, void *event_param) {
    if (event == TWR_BUTTON_EVENT_CLICK) {
        set_buzzer_is_buzzing(false);
        if (strlen(reminderId) > 0) {
            char payload[64];
            strcpy(payload, reminderId);
            reminderId[0] = '\0';
            pub_string("button/press", payload);
        } else {
            pub_string("button/press", "");
        }
    }
}

void buzzer_remote_event_handler(uint64_t *id, const char *topic, void *value, void *param) {
    const char *buzz_value = (const char *)value;
    if (strlen(reminderId) > 0) { return; }
    if (strncmp(buzz_value, "buzz:", 5) == 0) {
        const char *id_start = buzz_value + 5;
        strncpy(reminderId, id_start, sizeof(reminderId) - 1);
        reminderId[sizeof(reminderId) - 1] = '\0';
        set_buzzer_is_buzzing(true);
    }
}

void radio_event_handler(twr_radio_event_t event, void *event_param) {
    if (event == TWR_RADIO_EVENT_INIT_DONE) {
        deviceId = twr_radio_get_my_id();
        // radio subscriptions
        static char topic[64];
        snprintf(topic, sizeof(topic), "device/%llx/buzzer", deviceId);
        radio_subs[0].topic = topic;
        radio_subs[0].type = TWR_RADIO_SUB_PT_STRING;
        radio_subs[0].callback = buzzer_remote_event_handler;
        radio_subs[0].param = NULL;
        twr_radio_set_subs(radio_subs, 1);
        pub_string("connect", "");
    }
}

void application_init(void) {
    // logging
    twr_log_init(TWR_LOG_LEVEL_DEBUG, TWR_LOG_TIMESTAMP_ABS);

    // buzzer
    twr_gpio_init(BUZZER_GPIO);
    twr_gpio_set_mode(BUZZER_GPIO, TWR_GPIO_MODE_OUTPUT);
    set_buzzer_is_buzzing(false);

    // button
    twr_button_init(&button, BUTTON_GPIO, TWR_GPIO_PULL_DOWN, false);
    twr_button_set_event_handler(&button, button_event_handler, NULL);

    // radio
    twr_radio_init(TWR_RADIO_MODE_NODE_LISTENING);
    twr_radio_set_event_handler(radio_event_handler, NULL);
    twr_radio_pairing_request("pet feeder", FW_VERSION);
}