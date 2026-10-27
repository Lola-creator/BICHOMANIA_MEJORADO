
ALTER TABLE detalles_encuestas MODIFY votos INT NOT NULL DEFAULT 0;
UPDATE detalles_encuestas SET votos = 0 WHERE votos IS NULL;

ALTER TABLE votos_encuestas
  ADD CONSTRAINT uq_voto_cliente_encuesta UNIQUE (id_cliente, id_encuesta);
