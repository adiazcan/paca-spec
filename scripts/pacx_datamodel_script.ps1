# =====================================================
# DATAMODEL CREATION SCRIPT
# =====================================================
# Custom Prefix: paca_

# 1. CREATE ALL TABLES
pacx table create --name "Status Notification" --plural "Status Notifications" --schemaName "paca_statusnotification" --primaryAttributeName "Recipient ID" --primaryAttributeSchemaName "paca_recipientid" --primaryAttributeMaxLength 100 --primaryAttributeRequiredLevel "ApplicationRequired"

# 2. CREATE ALL COLUMNS

# ===== PACA_STATUSNOTIFICATION COLUMNS =====
pacx column create --table "paca_statusnotification" --name "Channel" --schemaName "paca_channelcode" --type "Picklist" --requiredLevel "ApplicationRequired" --globalOptionSetName "paca_notificationchannel" --options "In App:0,Email:1,Teams:2"
pacx column create --table "paca_statusnotification" --name "Delivery Status" --schemaName "paca_deliverystatuscode" --type "Picklist" --requiredLevel "ApplicationRequired" --globalOptionSetName "paca_notificationdeliverystatus" --options "Queued:0,Sent:1,Failed:2"
pacx column create --table "paca_statusnotification" --name "Payload" --schemaName "paca_payload" --type "Memo" --len 4000 --stringFormat "Text" --requiredLevel "ApplicationRequired"
pacx column create --table "paca_statusnotification" --name "Recipient ID" --schemaName "paca_recipientid" --type "String" --len 100 --stringFormat "Text" --requiredLevel "ApplicationRequired"
pacx column create --table "paca_statusnotification" --name "Sent At" --schemaName "paca_sentat" --type "DateTime" --requiredLevel "None" --dateTimeBehavior "UserLocal" --dateTimeFormat "DateAndTime"
# pacx column create --table "paca_statusnotification" --name "Status Notification" --schemaName "paca_statusnotificationid" --type "Uniqueidentifier" --requiredLevel "SystemRequired"

# 3. CREATE ALL RELATIONSHIPS
# --- N:1 RELATIONSHIPS ---
pacx rel create n1 --child "paca_statusnotification" --parent "paca_eventapprovalrequest" --relName "paca_statusnotification_eventapprovalrequest" --lookupSchemaName "paca_requestid"
# --- N:N RELATIONSHIPS ---

# ===================== STANDARD ENTITIES/RELATIONSHIPS =====================

# ===== PACA_STATUSNOTIFICATION STANDARD COLUMNS =====
# pacx column create --table "paca_statusnotification" --name "createdbyyominame" --schemaName "createdbyyominame" --type "String" --len 100 --stringFormat "Text" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "Created On" --schemaName "createdon" --type "DateTime" --requiredLevel "None" --dateTimeBehavior "UserLocal" --dateTimeFormat "DateAndTime"
# pacx column create --table "paca_statusnotification" --name "createdonbehalfbyyominame" --schemaName "createdonbehalfbyyominame" --type "String" --len 100 --stringFormat "Text" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "Import Sequence Number" --schemaName "importsequencenumber" --type "Integer" --intFormat "None" --requiredLevel "None" --min -2147483648 --max 2147483647
# pacx column create --table "paca_statusnotification" --name "modifiedbyyominame" --schemaName "modifiedbyyominame" --type "String" --len 100 --stringFormat "Text" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "Modified On" --schemaName "modifiedon" --type "DateTime" --requiredLevel "None" --dateTimeBehavior "UserLocal" --dateTimeFormat "DateAndTime"
# pacx column create --table "paca_statusnotification" --name "modifiedonbehalfbyyominame" --schemaName "modifiedonbehalfbyyominame" --type "String" --len 100 --stringFormat "Text" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "Record Created On" --schemaName "overriddencreatedon" --type "DateTime" --requiredLevel "None" --dateTimeBehavior "UserLocal" --dateTimeFormat "DateOnly"
# pacx column create --table "paca_statusnotification" --name "owneridtype" --schemaName "owneridtype" --type "EntityName" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "owneridyominame" --schemaName "owneridyominame" --type "String" --len 100 --stringFormat "Text" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "Status" --schemaName "statecode" --type "State" --requiredLevel "SystemRequired"
# pacx column create --table "paca_statusnotification" --name "Status Reason" --schemaName "statuscode" --type "Status" --requiredLevel "None"
# pacx column create --table "paca_statusnotification" --name "Time Zone Rule Version Number" --schemaName "timezoneruleversionnumber" --type "Integer" --intFormat "None" --requiredLevel "None" --min -1 --max 2147483647
# pacx column create --table "paca_statusnotification" --name "UTC Conversion Time Zone Code" --schemaName "utcconversiontimezonecode" --type "Integer" --intFormat "None" --requiredLevel "None" --min -1 --max 2147483647
# pacx column create --table "paca_statusnotification" --name "Version Number" --schemaName "versionnumber" --type "BigInt" --requiredLevel "None"

# --- N:1 RELATIONSHIPS (STANDARD) ---
# pacx rel create n1 --child "paca_statusnotification" --parent "businessunit" --relName "business_unit_paca_statusnotification" --lookupSchemaName "owningbusinessunit"
# pacx rel create n1 --child "paca_statusnotification" --parent "systemuser" --relName "lk_paca_statusnotification_createdby" --lookupSchemaName "createdby"
# pacx rel create n1 --child "paca_statusnotification" --parent "systemuser" --relName "lk_paca_statusnotification_createdonbehalfby" --lookupSchemaName "createdonbehalfby"
# pacx rel create n1 --child "paca_statusnotification" --parent "systemuser" --relName "lk_paca_statusnotification_modifiedby" --lookupSchemaName "modifiedby"
# pacx rel create n1 --child "paca_statusnotification" --parent "systemuser" --relName "lk_paca_statusnotification_modifiedonbehalfby" --lookupSchemaName "modifiedonbehalfby"
# pacx rel create n1 --child "paca_statusnotification" --parent "owner" --relName "owner_paca_statusnotification" --lookupSchemaName "ownerid"
# pacx rel create n1 --child "asyncoperation" --parent "paca_statusnotification" --relName "paca_statusnotification_AsyncOperations" --lookupSchemaName "regardingobjectid"
# pacx rel create n1 --child "bulkdeletefailure" --parent "paca_statusnotification" --relName "paca_statusnotification_BulkDeleteFailures" --lookupSchemaName "regardingobjectid"
# pacx rel create n1 --child "deleteditemreference" --parent "paca_statusnotification" --relName "paca_statusnotification_DeletedItemReferences" --lookupSchemaName "deletedobject"
# pacx rel create n1 --child "mailboxtrackingfolder" --parent "paca_statusnotification" --relName "paca_statusnotification_MailboxTrackingFolders" --lookupSchemaName "regardingobjectid"
# pacx rel create n1 --child "principalobjectattributeaccess" --parent "paca_statusnotification" --relName "paca_statusnotification_PrincipalObjectAttributeAccesses" --lookupSchemaName "objectid"
# pacx rel create n1 --child "processsession" --parent "paca_statusnotification" --relName "paca_statusnotification_ProcessSession" --lookupSchemaName "regardingobjectid"
# pacx rel create n1 --child "syncerror" --parent "paca_statusnotification" --relName "paca_statusnotification_SyncErrors" --lookupSchemaName "regardingobjectid"
# pacx rel create n1 --child "userentityinstancedata" --parent "paca_statusnotification" --relName "paca_statusnotification_UserEntityInstanceDatas" --lookupSchemaName "objectid"
# pacx rel create n1 --child "paca_statusnotification" --parent "team" --relName "team_paca_statusnotification" --lookupSchemaName "owningteam"
# pacx rel create n1 --child "paca_statusnotification" --parent "systemuser" --relName "user_paca_statusnotification" --lookupSchemaName "owninguser"
# --- N:N RELATIONSHIPS (STANDARD) ---
