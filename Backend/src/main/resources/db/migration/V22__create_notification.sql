-- notification
CREATE TABLE notification
(
    notification_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                BIGINT       NOT NULL,
    notification_type        VARCHAR(20)  NOT NULL,
    subject                     VARCHAR(150) NULL,
    message                       TEXT         NULL,
    notification_status              VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    sent_date                           DATETIME     NULL,
    created_date                           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                               BIGINT       NULL,
    modified_date                               DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by                                   BIGINT       NULL,
    is_active                                       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_notification_type CHECK (notification_type IN ('Email','SMS','InApp')),
    CONSTRAINT ck_notification_status CHECK (notification_status IN ('Pending','Sent','Failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE notification ADD CONSTRAINT fk_notification_user        FOREIGN KEY (user_id)    REFERENCES app_user(user_id);
ALTER TABLE notification ADD CONSTRAINT fk_notification_created_by  FOREIGN KEY (created_by) REFERENCES app_user(user_id);
ALTER TABLE notification ADD CONSTRAINT fk_notification_modified_by FOREIGN KEY (modified_by) REFERENCES app_user(user_id);
