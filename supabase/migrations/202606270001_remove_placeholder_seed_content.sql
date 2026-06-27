delete from public.revisions
where edited_by_member_id = 'seed-member'
   or entity_id::text in (
    'class-honors-chemistry',
    'class-ap-biology',
    'class-ap-calculus-bc',
    'subject-trigonometry',
    'subject-stoichiometry',
    'assignment-unit-3-chemistry-test',
    'assignment-textbook-problems-45-50',
    'resource-stoichiometry-review-guide'
   );

delete from public.entity_links
where source_id in (
  select id from public.classes where slug in ('honors-chemistry', 'ap-biology', 'ap-calculus-bc')
  union
  select id from public.subjects where slug in ('trigonometry', 'stoichiometry')
  union
  select id from public.assignments where slug in ('unit-3-chemistry-test', 'textbook-problems-45-50')
  union
  select id from public.resources where slug in ('stoichiometry-review-guide')
)
or target_id in (
  select id from public.classes where slug in ('honors-chemistry', 'ap-biology', 'ap-calculus-bc')
  union
  select id from public.subjects where slug in ('trigonometry', 'stoichiometry')
  union
  select id from public.assignments where slug in ('unit-3-chemistry-test', 'textbook-problems-45-50')
  union
  select id from public.resources where slug in ('stoichiometry-review-guide')
);

delete from public.resources where slug in ('stoichiometry-review-guide');
delete from public.assignments where slug in ('unit-3-chemistry-test', 'textbook-problems-45-50');
delete from public.subjects where slug in ('trigonometry', 'stoichiometry');
delete from public.classes where slug in ('honors-chemistry', 'ap-biology', 'ap-calculus-bc');
