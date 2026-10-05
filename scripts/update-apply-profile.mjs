import { getClient } from './db.mjs';

const client = getClient();
await client.connect();

await client.query(`
CREATE OR REPLACE FUNCTION public._apply_profile(p_uid uuid, p_email text, p jsonb, p_require_student_fields boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_first   text := nullif(btrim(coalesce(p ->> 'first_name', '')), '');
    v_last    text := btrim(coalesce(p ->> 'last_name', ''));
    v_contact text := public._normalize_phone(p ->> 'contact_number');
    v_wa      text := public._normalize_phone(p ->> 'whatsapp_number');
    v_inst    text := nullif(btrim(coalesce(p ->> 'institute_name', '')), '');
    v_city    text := nullif(btrim(coalesce(p ->> 'city_town', '')), '');
    v_stream  text := nullif(p ->> 'course_stream', '');
    v_board   text := nullif(p ->> 'board', '');
    v_food    text := nullif(p ->> 'food_preference', '');
    v_dob     date;
    v_age     integer;
    v_real_email text := lower(btrim(coalesce(nullif(p ->> 'email', ''), p_email)));
BEGIN
    IF v_real_email IS NULL OR v_real_email = '' THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;
    IF v_first IS NULL THEN
        IF p_require_student_fields THEN
            RAISE EXCEPTION 'Please enter the Name of the Student.';
        ELSE
            v_first := 'Student';
        END IF;
    END IF;
    IF char_length(v_first) > 100 OR char_length(v_last) > 100 THEN
        RAISE EXCEPTION 'Name is too long (maximum 100 characters).';
    END IF;
    IF v_contact IS NOT NULL AND v_contact !~ '^\\+?[0-9]{10,13}$' THEN
        RAISE EXCEPTION 'Please enter a valid contact number (10 to 13 digits).';
    END IF;
    IF v_wa IS NOT NULL AND v_wa !~ '^\\+?[0-9]{10,13}$' THEN
        RAISE EXCEPTION 'Please enter a valid WhatsApp number (10 to 13 digits).';
    END IF;
    IF v_inst IS NOT NULL AND char_length(v_inst) NOT BETWEEN 2 AND 255 THEN
        RAISE EXCEPTION 'Please provide a valid Name of the Institute.';
    END IF;
    IF v_city IS NOT NULL AND char_length(v_city) NOT BETWEEN 2 AND 100 THEN
        RAISE EXCEPTION 'Please enter a valid City / Town.';
    END IF;
    IF v_stream IS NOT NULL AND v_stream NOT IN ('12th Science', '12th Commerce', '12th Arts') THEN
        RAISE EXCEPTION 'Please choose a valid course stream.';
    END IF;
    IF v_board IS NOT NULL AND v_board NOT IN ('CBSE', 'ICSE', 'CHSE') THEN
        RAISE EXCEPTION 'Please choose a valid education board.';
    END IF;
    IF v_food IS NOT NULL AND v_food NOT IN ('Veg', 'Non-veg') THEN
        RAISE EXCEPTION 'Please choose a valid food preference.';
    END IF;
    BEGIN
        v_dob := nullif(p ->> 'date_of_birth', '')::date;
    EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Please enter a valid date of birth.';
    END;
    IF v_dob IS NOT NULL THEN
        v_age := extract(year FROM age(current_date, v_dob))::integer;
        IF v_age < 15 OR v_age > 20 THEN
            RAISE EXCEPTION 'Eligibility restriction: Only +2 Final Year students (ages 16 to 18) are eligible. Detected age: %', v_age;
        END IF;
    END IF;
    IF p_require_student_fields AND (v_contact IS NULL OR v_wa IS NULL OR v_inst IS NULL
        OR v_city IS NULL OR v_stream IS NULL OR v_food IS NULL) THEN
        RAISE EXCEPTION 'Please complete all required fields (contact number, WhatsApp number, institute, city, course and food preference).';
    END IF;

    INSERT INTO public.users AS u (id, email, first_name, last_name, contact_number, whatsapp_number,
        date_of_birth, institute_name, city_town, course_stream, board, food_preference,
        parent_consent, terms_accepted)
    VALUES (p_uid, v_real_email, v_first, v_last, v_contact, v_wa, v_dob, v_inst, v_city,
        v_stream, v_board::public.school_board, v_food,
        coalesce(p ->> 'parent_consent', '') = 'true', coalesce(p ->> 'terms_accepted', '') = 'true')
    ON CONFLICT (id) DO UPDATE SET
        email           = excluded.email,
        first_name      = excluded.first_name,
        last_name       = excluded.last_name,
        contact_number  = coalesce(excluded.contact_number, u.contact_number),
        whatsapp_number = coalesce(excluded.whatsapp_number, u.whatsapp_number),
        date_of_birth   = coalesce(excluded.date_of_birth, u.date_of_birth),
        institute_name  = coalesce(excluded.institute_name, u.institute_name),
        city_town       = coalesce(excluded.city_town, u.city_town),
        course_stream   = coalesce(excluded.course_stream, u.course_stream),
        board           = coalesce(excluded.board, u.board),
        food_preference = coalesce(excluded.food_preference, u.food_preference),
        parent_consent  = u.parent_consent OR excluded.parent_consent,
        terms_accepted  = u.terms_accepted OR excluded.terms_accepted;
END $$;
`);

console.log('Updated _apply_profile successfully.');
await client.end();
