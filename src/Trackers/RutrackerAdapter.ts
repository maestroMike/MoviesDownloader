﻿var rutrackerApi = require("rutracker-api");
import {ILoginPassword} from "../Config";
import {ITorrentTrackerSearchResult, TorrentTrackerType, TorrentTrackerId, ITorrent, ITorrentTrackerAdapter } from "./Interfaces";

export class RutrackerAdapter implements ITorrentTrackerAdapter {	
	readonly Key: TorrentTrackerType = TorrentTrackerType.Rutracker;
	rutracker: any;
	constructor(options: ILoginPassword)
	{
		this.rutracker = new rutrackerApi();
		this.rutracker.login( { username: options.login, password: options.password})
		.then(() => {
		  console.log('Rutracker: Authorized');
		})
		.catch(err => console.error(err));
	}

	async download(rutrackerId: number): Promise<ITorrent> {
		var fileContent = await this.downloadFile(rutrackerId);
		return { torrentFileContentBase64: fileContent }
	}

	async search(query: string): Promise<ITorrentTrackerSearchResult[]> {		
		var torrents = await this.rutracker.search({ query: query, sort: 'size' });		
		let convertedResults: ITorrentTrackerSearchResult[] = torrents.map( (x) => {
			return {
				id: TorrentTrackerId.create(TorrentTrackerType.Rutracker, x.id),
				state: x.state,
				category: x.category,
				title: x.title,
				sizeGb: Math.round((x.size / (1024 * 1024 * 1024)) * 10) /10,
				seeds: x.seeds,
				url: x.url	,
				IsHD: x.category.includes("(HD Video)")					
			};});
	

		console.info(`found ${convertedResults.length} torrents`);
		convertedResults = convertedResults
			.filter(this.notDvd)
			.filter(this.not3d)
			.filter(this.notForAppleTv)
			.filter(this.atLeast1Seed);
		
		return convertedResults
	}

	private async downloadFile(rutrackerId: number) : Promise<string>
	{
		return new Promise<string>(async (resolve) => {
			var response = await this.rutracker.download(rutrackerId)				
			var chunks = [];
			response.on("data", chunk => {
				chunks.push(chunk);
			});

			response.on("end", () => {
				const torrentFileContentBase64 = Buffer.concat(chunks).toString("base64");
				resolve(torrentFileContentBase64);
			});
		});
	}

	private notDvd(element: ITorrentTrackerSearchResult) {
		return !element.category.includes("(DVD)") && !element.category.includes("(DVD Video)");
	}

	private not3d(element: ITorrentTrackerSearchResult) {
		return !element.category.includes("3D");
	}

	private notForAppleTv(element: ITorrentTrackerSearchResult) {
		return element.category !== "Фильмы HD для Apple TV";
	}

	private atLeast1Seed(element: ITorrentTrackerSearchResult) {
		return element.seeds >= 1;
	}
}