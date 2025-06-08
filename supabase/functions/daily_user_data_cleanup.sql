
CREATE OR REPLACE FUNCTION public.daily_user_data_cleanup()
RETURNS VOID AS $$
DECLARE
    usr RECORD;
    free_tier_company_limit INT := 25;     -- Match src/lib/config.ts
    free_tier_contact_limit INT := 25;     -- Match src/lib/config.ts
    free_tier_job_opening_limit INT := 30; -- Match src/lib/config.ts
    grace_period_days INT := 7;
BEGIN
    FOR usr IN
        SELECT
            us.user_id,
            us.plan_expiry_date
        FROM
            public.user_subscriptions us
        WHERE
            us.tier = 'premium' -- User was on a premium plan
            -- Ensure we're targeting subscriptions whose grace period has definitively ended
            AND (us.plan_expiry_date IS NOT NULL AND (us.plan_expiry_date::date + grace_period_days) < current_date)
    LOOP
        RAISE NOTICE 'Processing cleanup for user: % whose premium plan expired around % and grace period has ended.', usr.user_id, usr.plan_expiry_date;

        -- For Job Openings, handle dependencies: follow_ups and job_opening_contacts
        -- Delete dependent records for excess job openings first
        WITH excess_job_openings_to_delete AS (
            SELECT id
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
                FROM public.job_openings
                WHERE user_id = usr.user_id
            ) ranked_openings
            WHERE rn > free_tier_job_opening_limit
        )
        DELETE FROM public.follow_ups WHERE job_opening_id IN (SELECT id FROM excess_job_openings_to_delete) AND user_id = usr.user_id;
        RAISE NOTICE 'Cleaned up follow_ups for excess job openings for user %.', usr.user_id;

        WITH excess_job_openings_to_delete AS (
            SELECT id
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
                FROM public.job_openings
                WHERE user_id = usr.user_id
            ) ranked_openings
            WHERE rn > free_tier_job_opening_limit
        )
        DELETE FROM public.job_opening_contacts WHERE job_opening_id IN (SELECT id FROM excess_job_openings_to_delete) AND user_id = usr.user_id;
        RAISE NOTICE 'Cleaned up job_opening_contacts for excess job openings for user %.', usr.user_id;

        -- Now delete excess job openings themselves
        PERFORM public.delete_excess_records_for_user(usr.user_id, 'job_openings', free_tier_job_opening_limit);

        -- Delete excess contacts
        PERFORM public.delete_excess_records_for_user(usr.user_id, 'contacts', free_tier_contact_limit);

        -- Delete excess companies
        PERFORM public.delete_excess_records_for_user(usr.user_id, 'companies', free_tier_company_limit);

        -- Delete the user's subscription record entirely, as they are now effectively on the Free Tier
        DELETE FROM public.user_subscriptions
        WHERE user_id = usr.user_id;
        
        RAISE NOTICE 'User % subscription record deleted after data cleanup.', usr.user_id;

    END LOOP;
    RAISE NOTICE 'Daily user data cleanup finished.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The helper function delete_excess_records_for_user remains the same.
-- If you need its definition, it is:
/*
CREATE OR REPLACE FUNCTION public.delete_excess_records_for_user(
    p_user_id UUID,
    p_entity_table_name TEXT,
    p_limit INT
)
RETURNS VOID AS $$
DECLARE
    row_count INT;
    dynamic_query TEXT;
BEGIN
    -- Get current count for the entity
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE user_id = %L', p_entity_table_name, p_user_id) INTO row_count;

    IF row_count > p_limit THEN
        -- Construct and execute delete query for excess records, keeping the oldest
        -- This assumes a 'created_at' column exists for ordering
        dynamic_query := format(
            'WITH ranked_items AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
                FROM public.%I
                WHERE user_id = %L
            )
            DELETE FROM public.%I
            WHERE id IN (
                SELECT id FROM ranked_items WHERE rn > %L
            ) AND user_id = %L;',
            p_entity_table_name, p_user_id, p_entity_table_name, p_limit, p_user_id
        );
        EXECUTE dynamic_query;

        RAISE NOTICE 'For user %: Deleted % records from %s. Kept % records.',
                     p_user_id, row_count - p_limit, p_entity_table_name, p_limit;
    ELSE
        RAISE NOTICE 'For user %: No excess records to delete from %s. Count: %, Limit: %',
                     p_user_id, p_entity_table_name, row_count, p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
