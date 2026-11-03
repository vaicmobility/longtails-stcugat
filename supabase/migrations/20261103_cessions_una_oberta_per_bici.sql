-- Una bici només pot tenir una cessió oberta (programada o activa) alhora.
-- Les cessions no modifiquen l'estat de la bici: la bici resta assignada al contracte de l'organització.
create unique index if not exists cessions_una_oberta_per_bici
  on public.cessions (bicicleta_id)
  where estat in ('programada', 'activa');
